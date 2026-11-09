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
exports.NotificacaoController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_js_1 = require("../auth/jwt-auth.guard.js");
const notificacao_service_js_1 = require("./notificacao.service.js");
let NotificacaoController = class NotificacaoController {
    service;
    constructor(service) {
        this.service = service;
    }
    listar(req, naoLidas) {
        return this.service.listar(req.user.sub, naoLidas === 'true');
    }
    contar(req) {
        return this.service.contarNaoLidas(req.user.sub).then((n) => ({ naoLidas: n }));
    }
    marcarComoLida(id, req) {
        return this.service.marcarComoLida(id, req.user.sub);
    }
    marcarTodasComoLidas(req) {
        return this.service.marcarTodasComoLidas(req.user.sub);
    }
};
exports.NotificacaoController = NotificacaoController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('naoLidas')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], NotificacaoController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('contagem'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificacaoController.prototype, "contar", null);
__decorate([
    (0, common_1.Patch)(':id/ler'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], NotificacaoController.prototype, "marcarComoLida", null);
__decorate([
    (0, common_1.Patch)('ler-todas'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificacaoController.prototype, "marcarTodasComoLidas", null);
exports.NotificacaoController = NotificacaoController = __decorate([
    (0, common_1.Controller)('notificacoes'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [notificacao_service_js_1.NotificacaoService])
], NotificacaoController);
//# sourceMappingURL=notificacao.controller.js.map