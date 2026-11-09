"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OauthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const ALEXA_TOKEN_DIAS = 30;
const CODIGO_MINUTOS = 5;
const emMinutos = (min) => new Date(Date.now() + min * 60_000);
const emDias = (dias) => new Date(Date.now() + dias * 86_400_000);
let OauthService = class OauthService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async validarCredenciais(email, senha) {
        const usuario = await this.prisma.usuario.findUnique({ where: { email } });
        if (!usuario)
            throw new common_1.UnauthorizedException('E-mail ou senha incorretos');
        const ok = await bcrypt.compare(senha, usuario.senhaHash);
        if (!ok)
            throw new common_1.UnauthorizedException('E-mail ou senha incorretos');
        return usuario;
    }
    async gerarCodigo(usuarioId, redirectUri) {
        const codigo = (0, crypto_1.randomBytes)(32).toString('hex');
        await this.prisma.codigoOAuth.create({
            data: { codigo, usuarioId, redirectUri, expiraEm: emMinutos(CODIGO_MINUTOS) },
        });
        return codigo;
    }
    async trocarCodigo(code, redirectUri) {
        const registro = await this.prisma.codigoOAuth.findUnique({ where: { codigo: code } });
        if (!registro || registro.usado || registro.expiraEm < new Date()) {
            throw new common_1.UnauthorizedException('Código inválido ou expirado');
        }
        if (registro.redirectUri !== redirectUri) {
            throw new common_1.UnauthorizedException('redirect_uri não corresponde');
        }
        await this.prisma.codigoOAuth.update({ where: { id: registro.id }, data: { usado: true } });
        const accessToken = await this.jwt.signAsync({ sub: registro.usuarioId, scope: 'alexa' }, { expiresIn: `${ALEXA_TOKEN_DIAS}d` });
        const refreshToken = (0, crypto_1.randomBytes)(48).toString('hex');
        const expiraEm = emDias(ALEXA_TOKEN_DIAS);
        await this.prisma.vinculoAlexa.create({
            data: {
                usuarioId: registro.usuarioId,
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
    async refresharToken(refreshToken) {
        const vinculo = await this.prisma.vinculoAlexa.findFirst({
            where: { refreshToken, ativo: true, expiraEm: { gt: new Date() } },
        });
        if (!vinculo)
            throw new common_1.UnauthorizedException('refresh_token inválido');
        const accessToken = await this.jwt.signAsync({ sub: vinculo.usuarioId, scope: 'alexa' }, { expiresIn: `${ALEXA_TOKEN_DIAS}d` });
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
};
exports.OauthService = OauthService;
exports.OauthService = OauthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        jwt_1.JwtService])
], OauthService);
//# sourceMappingURL=oauth.service.js.map