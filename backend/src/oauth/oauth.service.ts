import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';

const ALEXA_TOKEN_DIAS = 30;
const CODIGO_MINUTOS = 5;

const emMinutos = (min: number) => new Date(Date.now() + min * 60_000);
const emDias = (dias: number) => new Date(Date.now() + dias * 86_400_000);

@Injectable()
export class OauthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async validarCredenciais(email: string, senha: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (!usuario) throw new UnauthorizedException('E-mail ou senha incorretos');

    const ok = await bcrypt.compare(senha, usuario.senhaHash);
    if (!ok) throw new UnauthorizedException('E-mail ou senha incorretos');

    return usuario;
  }

  async gerarCodigo(usuarioId: number, redirectUri: string): Promise<string> {
    const codigo = randomBytes(32).toString('hex');
    await this.prisma.codigoOauth.create({
      data: { codigo, usuarioId, redirectUri, expiraEm: emMinutos(CODIGO_MINUTOS) },
    });
    return codigo;
  }

  async trocarCodigo(code: string, redirectUri: string) {
    const registro = await this.prisma.codigoOauth.findUnique({ where: { codigo: code } });
    if (!registro || registro.usado || registro.expiraEm < new Date()) {
      throw new UnauthorizedException('Código inválido ou expirado');
    }
    if (registro.redirectUri !== redirectUri) {
      throw new UnauthorizedException('redirect_uri não corresponde');
    }

    await this.prisma.codigoOauth.update({ where: { id: registro.id }, data: { usado: true } });

    const accessToken = await this.jwt.signAsync(
      { sub: registro.usuarioId, scope: 'alexa' },
      { expiresIn: `${ALEXA_TOKEN_DIAS}d` },
    );
    const refreshToken = randomBytes(48).toString('hex');
    const expiraEm = emDias(ALEXA_TOKEN_DIAS);

    await this.prisma.vinculoAlexa.create({
      data: {
        usuarioId: registro.usuarioId,
        alexaUserId: null,
        accessToken,
        refreshToken,
        expiraEm,
      },
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: ALEXA_TOKEN_DIAS * 86400,
      refresh_token: refreshToken,
    };
  }

  async refresharToken(refreshToken: string) {
    const vinculo = await this.prisma.vinculoAlexa.findFirst({
      where: { refreshToken, ativo: true, expiraEm: { gt: new Date() } },
    });
    if (!vinculo) throw new UnauthorizedException('refresh_token inválido');

    const accessToken = await this.jwt.signAsync(
      { sub: vinculo.usuarioId, scope: 'alexa' },
      { expiresIn: `${ALEXA_TOKEN_DIAS}d` },
    );
    const expiraEm = emDias(ALEXA_TOKEN_DIAS);

    await this.prisma.vinculoAlexa.update({
      where: { id: vinculo.id },
      data: { accessToken, expiraEm },
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: ALEXA_TOKEN_DIAS * 86400,
    };
  }
}
