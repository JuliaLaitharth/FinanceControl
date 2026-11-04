import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { IsEmail, IsString } from 'class-validator';
import { OauthService } from './oauth.service.js';

class LoginOAuthDto {
  @IsEmail()
  email!: string;

  @IsString()
  senha!: string;

  @IsString()
  redirectUri!: string;

  @IsString()
  state!: string;
}

class TokenDto {
  @IsString()
  grant_type!: string;

  code?: string;
  redirect_uri?: string;
  refresh_token?: string;
}

const htmlPagina = (redirectUri: string, state: string) => `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FinanceControl — Autorizar Alexa</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #f4f6f8; display: flex; justify-content: center;
           align-items: center; min-height: 100vh; }
    .card { background: #fff; border-radius: 12px; padding: 40px; width: 100%;
            max-width: 400px; box-shadow: 0 4px 24px rgba(0,0,0,.12); }
    h1 { font-size: 1.5rem; color: #1a237e; margin-bottom: 8px; }
    p { color: #555; font-size: .9rem; margin-bottom: 24px; }
    label { display: block; font-size: .85rem; font-weight: 600; color: #333;
            margin-bottom: 4px; margin-top: 16px; }
    input { width: 100%; padding: 10px 14px; border: 1.5px solid #d0d7de;
            border-radius: 8px; font-size: 1rem; outline: none; }
    input:focus { border-color: #1a237e; }
    button { margin-top: 24px; width: 100%; padding: 12px; background: #1a237e;
             color: #fff; border: none; border-radius: 8px; font-size: 1rem;
             font-weight: 600; cursor: pointer; }
    button:disabled { opacity: .6; cursor: default; }
    .erro { color: #c62828; font-size: .85rem; margin-top: 12px; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>FinanceControl</h1>
    <p>Faça login para vincular sua conta à Alexa.</p>
    <label for="email">E-mail</label>
    <input id="email" type="email" autocomplete="email" placeholder="seu@email.com">
    <label for="senha">Senha</label>
    <input id="senha" type="password" autocomplete="current-password" placeholder="••••••••">
    <div class="erro" id="erro"></div>
    <button id="btn">Autorizar</button>
  </div>
  <script>
    document.getElementById('btn').addEventListener('click', async () => {
      const btn = document.getElementById('btn');
      const erroEl = document.getElementById('erro');
      btn.disabled = true;
      erroEl.style.display = 'none';
      try {
        const res = await fetch('/oauth/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: document.getElementById('email').value,
            senha: document.getElementById('senha').value,
            redirectUri: ${JSON.stringify(redirectUri)},
            state: ${JSON.stringify(state)},
          }),
        });
        const data = await res.json();
        if (!res.ok) { erroEl.textContent = data.message ?? 'Erro ao autenticar'; erroEl.style.display='block'; btn.disabled=false; return; }
        window.location.href = data.redirectTo;
      } catch { erroEl.textContent = 'Erro de rede. Tente novamente.'; erroEl.style.display='block'; btn.disabled=false; }
    });
  </script>
</body>
</html>`;

@Controller('oauth')
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @Get('authorize')
  paginaAutorizar(
    @Query('redirect_uri') redirectUri: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!redirectUri || !state) {
      return res.status(400).send('Parâmetros redirect_uri e state são obrigatórios');
    }
    return res.type('html').send(htmlPagina(redirectUri, state));
  }

  @Post('authorize')
  async processarLogin(@Body() dto: LoginOAuthDto) {
    const usuario = await this.oauthService.validarCredenciais(dto.email, dto.senha);
    const codigo = await this.oauthService.gerarCodigo(usuario.id, dto.redirectUri);

    const url = new URL(dto.redirectUri);
    url.searchParams.set('code', codigo);
    url.searchParams.set('state', dto.state);
    return { redirectTo: url.toString() };
  }

  @Post('token')
  @HttpCode(200)
  async token(@Body() dto: TokenDto) {
    if (dto.grant_type === 'authorization_code') {
      if (!dto.code || !dto.redirect_uri) {
        throw new BadRequestException('code e redirect_uri são obrigatórios');
      }
      return this.oauthService.trocarCodigo(dto.code, dto.redirect_uri);
    }

    if (dto.grant_type === 'refresh_token') {
      if (!dto.refresh_token) throw new BadRequestException('refresh_token é obrigatório');
      return this.oauthService.refresharToken(dto.refresh_token);
    }

    throw new BadRequestException('grant_type inválido');
  }
}
