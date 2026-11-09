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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const lgpd_service_1 = require("../lgpd/lgpd.service");
const class_validator_1 = require("class-validator");
const auth_service_1 = require("./auth.service");
const biometria_dto_1 = require("./dto/biometria.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const login_dto_1 = require("./dto/login.dto");
const refresh_dto_1 = require("./dto/refresh.dto");
const register_dto_1 = require("./dto/register.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
class FcmTokenDto {
    token;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FcmTokenDto.prototype, "token", void 0);
class AlexaIdDto {
    alexaUserId;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlexaIdDto.prototype, "alexaUserId", void 0);
class AtualizarPerfilDto {
    nome;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], AtualizarPerfilDto.prototype, "nome", void 0);
class AlterarSenhaDto {
    senhaAtual;
    novaSenha;
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AlterarSenhaDto.prototype, "senhaAtual", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], AlterarSenhaDto.prototype, "novaSenha", void 0);
let AuthController = class AuthController {
    auth;
    lgpd;
    constructor(auth, lgpd) {
        this.auth = auth;
        this.lgpd = lgpd;
    }
    register(dto, ip) {
        return this.auth.register(dto, ip);
    }
    login(dto, ip) {
        return this.auth.login(dto, ip);
    }
    refresh(dto) {
        return this.auth.refresh(dto);
    }
    forgotPassword(dto, ip) {
        return this.auth.forgotPassword(dto, ip);
    }
    resetPassword(dto, ip) {
        return this.auth.resetPassword(dto, ip);
    }
    async logout(req, ip) {
        await this.auth.logout(req.user.userId, req.user.sessaoId, ip);
    }
    biometria(req, dto, ip) {
        return this.auth.alterarBiometria(req.user.userId, dto.ativa, ip);
    }
    me(req) {
        return this.auth.me(req.user.userId);
    }
    registrarFcmToken(req, dto) {
        return this.auth.registrarFcmToken(req.user.userId, dto.token);
    }
    async vincularAlexaId(req, dto) {
        await this.auth.vincularAlexaId(req.user.userId, dto.alexaUserId);
    }
    atualizarPerfil(req, dto) {
        return this.auth.atualizarPerfil(req.user.userId, dto.nome);
    }
    alterarSenha(req, dto, ip) {
        return this.auth.alterarSenha(req.user.userId, dto.senhaAtual, dto.novaSenha, ip);
    }
    async excluirConta(req, ip) {
        await this.lgpd.excluirConta(req.user.userId, ip);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_dto_1.RefreshDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('biometria'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, biometria_dto_1.BiometriaDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "biometria", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('fcm-token'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, FcmTokenDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "registrarFcmToken", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('alexa-id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AlexaIdDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "vincularAlexaId", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('perfil'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AtualizarPerfilDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "atualizarPerfil", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)('senha'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, AlterarSenhaDto, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "alterarSenha", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('conta'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "excluirConta", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        lgpd_service_1.LgpdService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map