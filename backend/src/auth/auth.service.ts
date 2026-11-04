import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const BCRYPT_ROUNDS = 12;
const MAX_TENTATIVAS = 5; // HU01: bloqueio após 5 tentativas inválidas
const BLOQUEIO_MINUTOS = 15; // HU01: bloqueio temporário de 15 minutos
const SESSAO_DIAS = 30; // HU01: sessão expira em 30 dias
const RECUPERACAO_MINUTOS = 30; // HU01: token de recuperação válido por 30 minutos

const MSG_CREDENCIAIS = 'E-mail ou senha incorretos';
const MSG_LINK_INVALIDO = 'Link expirado ou inválido. Solicite um novo link.';
const MSG_SESSAO = 'Sessão expirada. Faça login novamente.';

const sha256 = (valor: string) => createHash('sha256').update(valor).digest('hex');
const emMinutos = (min: number) => new Date(Date.now() + min * 60_000);
const emDias = (dias: number) => new Date(Date.now() + dias * 86_400_000);

@Injectable()
export class AuthService {
  // Hash falso: gasta o mesmo tempo quando o e-mail não existe, para não vazar essa informação.
  private readonly hashFalso = bcrypt.hashSync('senha-falsa-1', BCRYPT_ROUNDS);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto, ip?: string) {
    const existente = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existente) throw new ConflictException('E-mail já cadastrado');

    const senhaHash = await bcrypt.hash(dto.senha, BCRYPT_ROUNDS);

    let usuario: Usuario;
    try {
      usuario = await this.prisma.usuario.create({
        data: { nome: dto.nome, email: dto.email, senhaHash },
      });
    } catch (erro) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
        throw new ConflictException('E-mail já cadastrado');
      }
      throw erro;
    }

    await this.audit.registrar(usuario.id, 'CADASTRO', 'usuario', ip);
    const tokens = await this.iniciarSessao(usuario.id);
    return { ...tokens, usuario: this.publico(usuario) };
  }

  async login(dto: LoginDto, ip?: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } });

    if (!usuario) {
      await bcrypt.compare(dto.senha, this.hashFalso);
      throw new UnauthorizedException(MSG_CREDENCIAIS);
    }

    if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
      const minutos = Math.ceil((usuario.bloqueadoAte.getTime() - Date.now()) / 60_000);
      await this.audit.registrar(usuario.id, 'LOGIN_BLOQUEADO', 'usuario', ip);
      throw new HttpException(
        `Muitas tentativas inválidas. Tente novamente em ${minutos} minuto(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const senhaConfere = await bcrypt.compare(dto.senha, usuario.senhaHash);

    if (!senhaConfere) {
      const atualizado = await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { tentativasFalhas: { increment: 1 } },
      });
      if (atualizado.tentativasFalhas >= MAX_TENTATIVAS) {
        await this.prisma.usuario.update({
          where: { id: usuario.id },
          data: { tentativasFalhas: 0, bloqueadoAte: emMinutos(BLOQUEIO_MINUTOS) },
        });
      }
      await this.audit.registrar(usuario.id, 'LOGIN_FALHA', 'usuario', ip);
      throw new UnauthorizedException(MSG_CREDENCIAIS);
    }

    const atualizado = await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { tentativasFalhas: 0, bloqueadoAte: null, ultimoLogin: new Date() },
    });
    await this.audit.registrar(usuario.id, 'LOGIN', 'usuario', ip);

    const tokens = await this.iniciarSessao(usuario.id);
    return { ...tokens, usuario: this.publico(atualizado) };
  }

  // Usado pelo app para renovar o acesso e pelo desbloqueio biométrico.
  async refresh(dto: RefreshDto) {
    const sessao = await this.prisma.sessao.findUnique({
      where: { refreshHash: sha256(dto.refreshToken) },
    });
    if (!sessao || sessao.revogada || sessao.expiraEm < new Date()) {
      throw new UnauthorizedException(MSG_SESSAO);
    }

    const novoRefresh = randomBytes(48).toString('hex');
    const expiraEm = emDias(SESSAO_DIAS);
    await this.prisma.sessao.update({
      where: { id: sessao.id },
      data: { refreshHash: sha256(novoRefresh), expiraEm },
    });

    const accessToken = await this.jwt.signAsync({ sub: sessao.usuarioId, sid: sessao.id });
    return { accessToken, refreshToken: novoRefresh, expiraEm };
  }

  async logout(usuarioId: number, sessaoId: string, ip?: string) {
    await this.prisma.sessao.update({ where: { id: sessaoId }, data: { revogada: true } });
    await this.audit.registrar(usuarioId, 'LOGOUT', 'sessao', ip);
  }

  async forgotPassword(dto: ForgotPasswordDto, ip?: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } });

    if (usuario) {
      // Só o último link vale.
      await this.prisma.tokenRecuperacao.updateMany({
        where: { usuarioId: usuario.id, usado: false },
        data: { usado: true },
      });

      const token = randomBytes(32).toString('hex');
      await this.prisma.tokenRecuperacao.create({
        data: {
          usuarioId: usuario.id,
          token: sha256(token),
          expiraEm: emMinutos(RECUPERACAO_MINUTOS),
        },
      });
      await this.mail.enviarRecuperacaoSenha(usuario.email, token);
      await this.audit.registrar(usuario.id, 'RECUPERACAO_SOLICITADA', 'usuario', ip);
    }

    // Mesma resposta exista ou não o e-mail.
    return {
      mensagem: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.',
    };
  }

  async resetPassword(dto: ResetPasswordDto, ip?: string) {
    const registro = await this.prisma.tokenRecuperacao.findUnique({
      where: { token: sha256(dto.token) },
    });
    if (!registro || registro.usado || registro.expiraEm < new Date()) {
      throw new BadRequestException(MSG_LINK_INVALIDO);
    }

    const senhaHash = await bcrypt.hash(dto.novaSenha, BCRYPT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      // Uso único: só um pedido consegue marcar o token como usado.
      const marcado = await tx.tokenRecuperacao.updateMany({
        where: { id: registro.id, usado: false },
        data: { usado: true },
      });
      if (marcado.count === 0) throw new BadRequestException(MSG_LINK_INVALIDO);

      await tx.usuario.update({
        where: { id: registro.usuarioId },
        data: { senhaHash, tentativasFalhas: 0, bloqueadoAte: null },
      });
      // Senha redefinida invalida todas as sessões anteriores.
      await tx.sessao.updateMany({
        where: { usuarioId: registro.usuarioId, revogada: false },
        data: { revogada: true },
      });
    });

    await this.audit.registrar(registro.usuarioId, 'SENHA_REDEFINIDA', 'usuario', ip);
    return { mensagem: 'Senha redefinida com sucesso. Faça login novamente.' };
  }

  async alterarBiometria(usuarioId: number, ativa: boolean, ip?: string) {
    const usuario = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { biometriaAtiva: ativa },
    });
    await this.audit.registrar(
      usuarioId,
      ativa ? 'BIOMETRIA_ATIVADA' : 'BIOMETRIA_DESATIVADA',
      'usuario',
      ip,
    );
    return this.publico(usuario);
  }

  async me(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
    return this.publico(usuario);
  }

  async registrarFcmToken(usuarioId: number, token: string): Promise<void> {
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { fcmToken: token },
    });
  }

  async atualizarPerfil(usuarioId: number, nome: string) {
    const usuario = await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { nome },
    });
    await this.audit.registrar(usuarioId, 'PERFIL_ATUALIZADO', 'usuario');
    return this.publico(usuario);
  }

  async alterarSenha(usuarioId: number, senhaAtual: string, novaSenha: string, ip?: string) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
    const ok = await bcrypt.compare(senhaAtual, usuario.senhaHash);
    if (!ok) throw new UnauthorizedException('Senha atual incorreta');

    const senhaHash = await bcrypt.hash(novaSenha, BCRYPT_ROUNDS);
    await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id: usuarioId }, data: { senhaHash } });
      await tx.sessao.updateMany({ where: { usuarioId, revogada: false }, data: { revogada: true } });
    });

    await this.audit.registrar(usuarioId, 'SENHA_ALTERADA', 'usuario', ip);
    return { mensagem: 'Senha alterada com sucesso. Faça login novamente.' };
  }

  async vincularAlexaId(usuarioId: number, alexaUserId: string): Promise<void> {
    await this.prisma.vinculoAlexa.updateMany({
      where: { usuarioId, ativo: true },
      data: { alexaUserId },
    });
  }

  private async iniciarSessao(usuarioId: number) {
    const refreshToken = randomBytes(48).toString('hex');
    const sessao = await this.prisma.sessao.create({
      data: { usuarioId, refreshHash: sha256(refreshToken), expiraEm: emDias(SESSAO_DIAS) },
    });
    const accessToken = await this.jwt.signAsync({ sub: usuarioId, sid: sessao.id });
    return { accessToken, refreshToken, expiraEm: sessao.expiraEm };
  }

  private publico(usuario: { id: number; nome: string; email: string; biometriaAtiva: boolean }) {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      biometriaAtiva: usuario.biometriaAtiva,
    };
  }
}