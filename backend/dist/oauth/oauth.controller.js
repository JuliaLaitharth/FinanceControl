"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OauthController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const oauth_service_js_1 = require("./oauth.service.js");
class LoginOAuthDto {
    email;
    senha;
    redirectUri;
    state;
}
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginOAuthDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginOAuthDto.prototype, "senha", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginOAuthDto.prototype, "redirectUri", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginOAuthDto.prototype, "state", void 0);
class TokenDto {
    grant_type;
    code;
    redirect_uri;
    refresh_token;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TokenDto.prototype, "grant_type", void 0);
const htmlPagina = (redirectUri, state) => `<!DOCTYPE html>
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
let OauthController = class OauthController {
    oauthService;
    constructor(oauthService) {
        this.oauthService = oauthService;
    }
    paginaAutorizar(redirectUri, state, res) {
        if (!redirectUri || !state) {
            return res.status(400).send('Parâmetros redirect_uri e state são obrigatórios');
        }
        return res.type('html').send(htmlPagina(redirectUri, state));
    }
    async processarLogin(dto) {
        const usuario = await this.oauthService.validarCredenciais(dto.email, dto.senha);
        const codigo = await this.oauthService.gerarCodigo(usuario.id, dto.redirectUri);
        const url = new URL(dto.redirectUri);
        url.searchParams.set('code', codigo);
        url.searchParams.set('state', dto.state);
        return { redirectTo: url.toString() };
    }
    async token(dto) {
        if (dto.grant_type === 'authorization_code') {
            if (!dto.code || !dto.redirect_uri) {
                throw new common_1.BadRequestException('code e redirect_uri são obrigatórios');
            }
            return this.oauthService.trocarCodigo(dto.code, dto.redirect_uri);
        }
        if (dto.grant_type === 'refresh_token') {
            if (!dto.refresh_token)
                throw new common_1.BadRequestException('refresh_token é obrigatório');
            return this.oauthService.refresharToken(dto.refresh_token);
        }
        throw new common_1.BadRequestException('grant_type inválido');
    }
};
exports.OauthController = OauthController;
__decorate([
    (0, common_1.Get)('authorize'),
    __param(0, (0, common_1.Query)('redirect_uri')),
    __param(1, (0, common_1.Query)('state')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], OauthController.prototype, "paginaAutorizar", null);
__decorate([
    (0, common_1.Post)('authorize'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginOAuthDto]),
    __metadata("design:returntype", Promise)
], OauthController.prototype, "processarLogin", null);
__decorate([
    (0, common_1.Post)('token'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [TokenDto]),
    __metadata("design:returntype", Promise)
], OauthController.prototype, "token", null);
exports.OauthController = OauthController = __decorate([
    (0, common_1.Controller)('oauth'),
    __metadata("design:paramtypes", [oauth_service_js_1.OauthService])
], OauthController);
//# sourceMappingURL=oauth.controller.js.map