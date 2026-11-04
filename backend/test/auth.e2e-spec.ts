import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMAIL = 'e2e@example.com';
const NOME = 'E2E Teste';
const SENHA = 'Senha123';

async function registrar(app: INestApplication<App>) {
  return request(app.getHttpServer())
    .post('/auth/register')
    .send({ nome: NOME, email: EMAIL, senha: SENHA });
}

// ─── Suíte ───────────────────────────────────────────────────────────────────

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    // Limpa apenas os dados de teste para garantir isolamento
    await prisma.sessao.deleteMany({ where: { usuario: { email: EMAIL } } });
    await prisma.tokenRecuperacao.deleteMany({ where: { usuario: { email: EMAIL } } });
    await prisma.logAuditoria.deleteMany({ where: { usuario: { email: EMAIL } } });
    await prisma.usuario.deleteMany({ where: { email: EMAIL } });
  });

  afterAll(async () => {
    await prisma.sessao.deleteMany({ where: { usuario: { email: EMAIL } } });
    await prisma.tokenRecuperacao.deleteMany({ where: { usuario: { email: EMAIL } } });
    await prisma.logAuditoria.deleteMany({ where: { usuario: { email: EMAIL } } });
    await prisma.usuario.deleteMany({ where: { email: EMAIL } });
    await app.close();
  });

  // ─── POST /auth/register ─────────────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('201 — cadastra usuário e retorna tokens', async () => {
      const res = await registrar(app);

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
      expect(res.body.usuario.email).toBe(EMAIL);
      expect(res.body.usuario).not.toHaveProperty('senhaHash');
    });

    it('409 — "E-mail já cadastrado" ao registrar e-mail duplicado', async () => {
      await registrar(app);
      const res = await registrar(app);

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('E-mail já cadastrado');
    });

    it('400 — rejeita senha sem números', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nome: NOME, email: EMAIL, senha: 'SemNumeros' });

      expect(res.status).toBe(400);
    });

    it('400 — rejeita senha com menos de 8 caracteres', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nome: NOME, email: EMAIL, senha: 'Ab1' });

      expect(res.status).toBe(400);
    });
  });

  // ─── POST /auth/login ────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    beforeEach(() => registrar(app));

    it('200 — retorna tokens no login bem-sucedido', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: EMAIL, senha: SENHA });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
    });

    it('401 — "E-mail ou senha incorretos" com senha errada', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: EMAIL, senha: 'SenhaErrada1' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('E-mail ou senha incorretos');
    });

    it('401 — "E-mail ou senha incorretos" com e-mail inexistente', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'inexistente@example.com', senha: SENHA });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('E-mail ou senha incorretos');
    });

    it('429 — bloqueia conta após 5 tentativas inválidas consecutivas', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: EMAIL, senha: 'SenhaErrada1' });
      }

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: EMAIL, senha: SENHA }); // senha correta, mas conta bloqueada

      expect(res.status).toBe(429);
    });
  });

  // ─── POST /auth/refresh ──────────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('200 — renova tokens com refresh token válido', async () => {
      const { body: reg } = await registrar(app);

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: reg.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).not.toBe(reg.refreshToken); // token rotacionado
    });

    it('401 — rejeita refresh token inválido', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'token-invalido' });

      expect(res.status).toBe(401);
    });
  });

  // ─── POST /auth/logout ───────────────────────────────────────────────────

  describe('POST /auth/logout', () => {
    it('204 — faz logout e invalida sessão', async () => {
      const { body: reg } = await registrar(app);

      const logoutRes = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${reg.accessToken}`);

      expect(logoutRes.status).toBe(204);

      // O refresh token desta sessão deve ser recusado após o logout
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: reg.refreshToken });

      expect(refreshRes.status).toBe(401);
    });

    it('401 — rejeita logout sem token de autenticação', async () => {
      const res = await request(app.getHttpServer()).post('/auth/logout');
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /auth/forgot-password ─────────────────────────────────────────

  describe('POST /auth/forgot-password', () => {
    it('200 — retorna mensagem genérica independentemente do e-mail', async () => {
      // e-mail existente
      await registrar(app);
      const resExistente = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: EMAIL });
      expect(resExistente.status).toBe(200);
      expect(resExistente.body.mensagem).toContain('Se o e-mail estiver cadastrado');

      // e-mail inexistente — mesma resposta
      const resInexistente = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'naoexiste@example.com' });
      expect(resInexistente.status).toBe(200);
      expect(resInexistente.body.mensagem).toBe(resExistente.body.mensagem);
    });
  });

  // ─── GET /auth/me ────────────────────────────────────────────────────────

  describe('GET /auth/me', () => {
    it('200 — retorna dados do usuário autenticado sem senhaHash', async () => {
      const { body: reg } = await registrar(app);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${reg.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(EMAIL);
      expect(res.body).not.toHaveProperty('senhaHash');
    });

    it('401 — rejeita requisição sem token', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');
      expect(res.status).toBe(401);
    });
  });

  // ─── PATCH /auth/biometria ───────────────────────────────────────────────

  describe('PATCH /auth/biometria', () => {
    it('200 — ativa e desativa biometria', async () => {
      const { body: reg } = await registrar(app);
      const auth = { Authorization: `Bearer ${reg.accessToken}` };

      const ativaRes = await request(app.getHttpServer())
        .patch('/auth/biometria')
        .set(auth)
        .send({ ativa: true });
      expect(ativaRes.status).toBe(200);
      expect(ativaRes.body.biometriaAtiva).toBe(true);

      const desativaRes = await request(app.getHttpServer())
        .patch('/auth/biometria')
        .set(auth)
        .send({ ativa: false });
      expect(desativaRes.status).toBe(200);
      expect(desativaRes.body.biometriaAtiva).toBe(false);
    });
  });

  // ─── ISOLAMENTO entre usuários ───────────────────────────────────────────

  describe('isolamento entre usuários', () => {
    it('token de um usuário não dá acesso a /auth/me de outro', async () => {
      // Cria usuário 1
      const { body: reg1 } = await registrar(app);

      // Cria usuário 2 com e-mail diferente
      const outro = 'outro@example.com';
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ nome: 'Outro', email: outro, senha: SENHA });

      // Token do usuário 1 retorna apenas dados do usuário 1
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${reg1.accessToken}`);

      expect(res.body.email).toBe(EMAIL);
      expect(res.body.email).not.toBe(outro);

      // Limpa usuário 2
      await prisma.sessao.deleteMany({ where: { usuario: { email: outro } } });
      await prisma.logAuditoria.deleteMany({ where: { usuario: { email: outro } } });
      await prisma.usuario.deleteMany({ where: { email: outro } });
    });
  });
});
