import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { createPrismaMock } from '../test-utils/prisma.mock';
import { AuthService } from './auth.service';

// Helpers para construir objetos de BD realistas nos testes
const usuarioBase = (overrides = {}) => ({
  id: 1,
  nome: 'Julia',
  email: 'julia@example.com',
  senhaHash: bcrypt.hashSync('Senha123', 10),
  biometriaAtiva: false,
  dataCadastro: new Date(),
  ultimoLogin: null,
  tentativasFalhas: 0,
  bloqueadoAte: null,
  ...overrides,
});

const sessaoBase = (overrides = {}) => ({
  id: 'sess-uuid',
  usuarioId: 1,
  refreshHash: 'hash',
  expiraEm: new Date(Date.now() + 30 * 86_400_000),
  revogada: false,
  criadoEm: new Date(),
  ...overrides,
});

const tokenBase = (overrides = {}) => ({
  id: 1,
  usuarioId: 1,
  token: 'tokenHashFake',
  expiraEm: new Date(Date.now() + 30 * 60_000),
  usado: false,
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    prisma = createPrismaMock();
    jwtService = { signAsync: jest.fn().mockResolvedValue('access-token') } as unknown as jest.Mocked<JwtService>;
    mailService = { enviarRecuperacaoSenha: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<MailService>;
    auditService = { registrar: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new AuthService(
      prisma as never,
      jwtService,
      auditService,
      mailService,
    );
  });

  // ─── CADASTRO ────────────────────────────────────────────────────────────────

  describe('register()', () => {
    it('cria usuário e retorna tokens quando e-mail é novo', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.usuario.create.mockResolvedValue(usuarioBase());
      prisma.sessao.create.mockResolvedValue(sessaoBase());

      const result = await service.register({
        nome: 'Julia',
        email: 'julia@example.com',
        senha: 'Senha123',
      });

      expect(result.accessToken).toBe('access-token');
      expect(result.usuario.email).toBe('julia@example.com');
      expect(auditService.registrar).toHaveBeenCalledWith(1, 'CADASTRO', 'usuario', undefined);
    });

    it('lança ConflictException com "E-mail já cadastrado" quando e-mail existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(usuarioBase());

      await expect(
        service.register({ nome: 'Julia', email: 'julia@example.com', senha: 'Senha123' }),
      ).rejects.toThrow(new ConflictException('E-mail já cadastrado'));
    });
  });

  // ─── LOGIN ────────────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('retorna tokens e zera tentativas no login bem-sucedido', async () => {
      const usuario = usuarioBase({ tentativasFalhas: 2 });
      prisma.usuario.findUnique.mockResolvedValue(usuario);
      prisma.usuario.update.mockResolvedValue({ ...usuario, tentativasFalhas: 0, ultimoLogin: new Date() });
      prisma.sessao.create.mockResolvedValue(sessaoBase());

      const result = await service.login({ email: 'julia@example.com', senha: 'Senha123' });

      expect(result.accessToken).toBe('access-token');
      expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ tentativasFalhas: 0, bloqueadoAte: null }),
      }));
    });

    it('lança UnauthorizedException com mensagem genérica quando e-mail não existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'naoexiste@example.com', senha: 'Senha123' }),
      ).rejects.toThrow(new UnauthorizedException('E-mail ou senha incorretos'));
    });

    it('incrementa tentativas_falhas e lança UnauthorizedException quando senha errada', async () => {
      const usuario = usuarioBase();
      prisma.usuario.findUnique.mockResolvedValue(usuario);
      prisma.usuario.update.mockResolvedValue({ ...usuario, tentativasFalhas: 1 });

      await expect(
        service.login({ email: 'julia@example.com', senha: 'SenhaErrada1' }),
      ).rejects.toThrow(new UnauthorizedException('E-mail ou senha incorretos'));

      expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { tentativasFalhas: { increment: 1 } },
      }));
    });

    it('bloqueia conta após 5 tentativas inválidas', async () => {
      const usuario = usuarioBase();
      prisma.usuario.findUnique.mockResolvedValue(usuario);
      // 5ª tentativa: update retorna tentativasFalhas = 5 → dispara bloqueio
      prisma.usuario.update
        .mockResolvedValueOnce({ ...usuario, tentativasFalhas: 5 })
        .mockResolvedValue({ ...usuario, tentativasFalhas: 0, bloqueadoAte: new Date(Date.now() + 15 * 60_000) });

      await expect(
        service.login({ email: 'julia@example.com', senha: 'SenhaErrada1' }),
      ).rejects.toThrow(UnauthorizedException);

      // Segunda chamada ao update deve definir bloqueadoAte
      expect(prisma.usuario.update).toHaveBeenNthCalledWith(2, expect.objectContaining({
        data: expect.objectContaining({ bloqueadoAte: expect.any(Date) }),
      }));
    });

    it('lança 429 e registra LOGIN_BLOQUEADO quando conta está bloqueada', async () => {
      const usuario = usuarioBase({
        bloqueadoAte: new Date(Date.now() + 10 * 60_000),
      });
      prisma.usuario.findUnique.mockResolvedValue(usuario);

      await expect(
        service.login({ email: 'julia@example.com', senha: 'Senha123' }),
      ).rejects.toThrow(HttpException);

      expect(auditService.registrar).toHaveBeenCalledWith(1, 'LOGIN_BLOQUEADO', 'usuario', undefined);
    });

    it('retorna a mesma mensagem genérica para e-mail inexistente e senha errada (não revela qual campo errou)', async () => {
      // e-mail inexistente
      prisma.usuario.findUnique.mockResolvedValue(null);
      let msgEmailInexistente = '';
      try {
        await service.login({ email: 'naoexiste@example.com', senha: 'Senha123' });
      } catch (e) {
        msgEmailInexistente = (e as Error).message;
      }

      // senha errada (e-mail existe)
      const usuario = usuarioBase();
      prisma.usuario.findUnique.mockResolvedValue(usuario);
      prisma.usuario.update.mockResolvedValue({ ...usuario, tentativasFalhas: 1 });
      let msgSenhaErrada = '';
      try {
        await service.login({ email: 'julia@example.com', senha: 'SenhaErrada1' });
      } catch (e) {
        msgSenhaErrada = (e as Error).message;
      }

      // A mensagem é idêntica em ambos os casos — não revela qual campo errou
      expect(msgEmailInexistente).toBe('E-mail ou senha incorretos');
      expect(msgSenhaErrada).toBe('E-mail ou senha incorretos');
      expect(msgEmailInexistente).toBe(msgSenhaErrada);
    });
  });

  // ─── REFRESH ─────────────────────────────────────────────────────────────────

  describe('refresh()', () => {
    it('retorna novos tokens quando sessão é válida', async () => {
      const sessao = sessaoBase();
      prisma.sessao.findUnique.mockResolvedValue(sessao);
      prisma.sessao.update.mockResolvedValue(sessao);

      const result = await service.refresh({ refreshToken: 'algum-token' });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeTruthy();
    });

    it('lança UnauthorizedException quando sessão foi revogada', async () => {
      prisma.sessao.findUnique.mockResolvedValue(sessaoBase({ revogada: true }));

      await expect(service.refresh({ refreshToken: 'revogado' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lança UnauthorizedException quando sessão está expirada', async () => {
      prisma.sessao.findUnique.mockResolvedValue(
        sessaoBase({ expiraEm: new Date(Date.now() - 1000) }),
      );

      await expect(service.refresh({ refreshToken: 'expirado' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('lança UnauthorizedException quando refresh token não existe', async () => {
      prisma.sessao.findUnique.mockResolvedValue(null);

      await expect(service.refresh({ refreshToken: 'nao-existe' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ─── LOGOUT ──────────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('revoga sessão e registra auditoria', async () => {
      prisma.sessao.update.mockResolvedValue(sessaoBase({ revogada: true }));

      await service.logout(1, 'sess-uuid', '127.0.0.1');

      expect(prisma.sessao.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'sess-uuid' },
        data: { revogada: true },
      }));
      expect(auditService.registrar).toHaveBeenCalledWith(1, 'LOGOUT', 'sessao', '127.0.0.1');
    });
  });

  // ─── RECUPERAÇÃO DE SENHA ────────────────────────────────────────────────────

  describe('forgotPassword()', () => {
    it('envia e-mail e invalida tokens anteriores quando e-mail existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(usuarioBase());
      prisma.tokenRecuperacao.updateMany.mockResolvedValue({ count: 0 });
      prisma.tokenRecuperacao.create.mockResolvedValue(tokenBase());

      const result = await service.forgotPassword({ email: 'julia@example.com' });

      expect(result.mensagem).toContain('Se o e-mail estiver cadastrado');
      expect(mailService.enviarRecuperacaoSenha).toHaveBeenCalledWith('julia@example.com', expect.any(String));
      // Invalida tokens anteriores
      expect(prisma.tokenRecuperacao.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: { usado: true },
      }));
    });

    it('retorna a mesma mensagem genérica quando e-mail não existe (sem vazar informação)', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'naoexiste@example.com' });

      expect(result.mensagem).toContain('Se o e-mail estiver cadastrado');
      expect(mailService.enviarRecuperacaoSenha).not.toHaveBeenCalled();
    });
  });

  // ─── REDEFINIÇÃO DE SENHA ────────────────────────────────────────────────────

  describe('resetPassword()', () => {
    it('redefine senha, invalida sessões e retorna confirmação', async () => {
      const token = tokenBase();
      prisma.tokenRecuperacao.findUnique.mockResolvedValue(token);

      // $transaction executa o callback passado
      prisma.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const txMock = {
          tokenRecuperacao: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
          usuario: { update: jest.fn().mockResolvedValue(usuarioBase()) },
          sessao: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        };
        return cb(txMock);
      });

      const result = await service.resetPassword({ token: 'raw-token', novaSenha: 'Nova1234' });

      expect(result.mensagem).toBe('Senha redefinida com sucesso. Faça login novamente.');
      expect(auditService.registrar).toHaveBeenCalledWith(1, 'SENHA_REDEFINIDA', 'usuario', undefined);
    });

    it('lança BadRequestException quando token está expirado', async () => {
      prisma.tokenRecuperacao.findUnique.mockResolvedValue(
        tokenBase({ expiraEm: new Date(Date.now() - 1000) }),
      );

      await expect(
        service.resetPassword({ token: 'expirado', novaSenha: 'Nova1234' }),
      ).rejects.toThrow(new BadRequestException('Link expirado ou inválido. Solicite um novo link.'));
    });

    it('lança BadRequestException quando token já foi usado', async () => {
      prisma.tokenRecuperacao.findUnique.mockResolvedValue(tokenBase({ usado: true }));

      await expect(
        service.resetPassword({ token: 'usado', novaSenha: 'Nova1234' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('lança BadRequestException quando token não existe', async () => {
      prisma.tokenRecuperacao.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'inexistente', novaSenha: 'Nova1234' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── BIOMETRIA ───────────────────────────────────────────────────────────────

  describe('alterarBiometria()', () => {
    it('ativa biometria e registra auditoria', async () => {
      const usuario = usuarioBase({ biometriaAtiva: true });
      prisma.usuario.update.mockResolvedValue(usuario);

      const result = await service.alterarBiometria(1, true, '127.0.0.1');

      expect(result.biometriaAtiva).toBe(true);
      expect(auditService.registrar).toHaveBeenCalledWith(1, 'BIOMETRIA_ATIVADA', 'usuario', '127.0.0.1');
    });

    it('desativa biometria e registra auditoria', async () => {
      const usuario = usuarioBase({ biometriaAtiva: false });
      prisma.usuario.update.mockResolvedValue(usuario);

      const result = await service.alterarBiometria(1, false, '127.0.0.1');

      expect(result.biometriaAtiva).toBe(false);
      expect(auditService.registrar).toHaveBeenCalledWith(1, 'BIOMETRIA_DESATIVADA', 'usuario', '127.0.0.1');
    });
  });

  // ─── ISOLAMENTO ──────────────────────────────────────────────────────────────

  describe('isolamento de dados entre usuários', () => {
    it('me() retorna apenas dados do usuário autenticado', async () => {
      prisma.usuario.findUniqueOrThrow.mockResolvedValue(usuarioBase({ id: 42 }));

      const result = await service.me(42);

      expect(prisma.usuario.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 42 } });
      expect(result.id).toBe(42);
    });
  });
});
