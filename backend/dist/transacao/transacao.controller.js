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
exports.TransacaoController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const jwt_auth_guard_js_1 = require("../auth/jwt-auth.guard.js");
class AjustarCategoriaDto {
    categoriaId;
}
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AjustarCategoriaDto.prototype, "categoriaId", void 0);
const filtro_transacao_dto_js_1 = require("./dto/filtro-transacao.dto.js");
const transacao_service_js_1 = require("./transacao.service.js");
let TransacaoController = class TransacaoController {
    service;
    constructor(service) {
        this.service = service;
    }
    listar(req, filtro) {
        return this.service.listar(req.user.sub, filtro);
    }
    resumoMensal(req, meses) {
        const n = meses ? Math.min(Math.max(parseInt(meses) || 6, 1), 12) : 6;
        return this.service.resumoMensal(req.user.sub, n);
    }
    resumoCategorias(req, dataInicio) {
        return this.service.resumoCategorias(req.user.sub, dataInicio);
    }
    ajustarCategoria(req, id, dto) {
        return this.service.ajustarCategoria(id, dto.categoriaId, req.user.sub);
    }
    sincronizar(req) {
        return this.service.sincronizar(req.user.sub, req.ip);
    }
};
exports.TransacaoController = TransacaoController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, filtro_transacao_dto_js_1.FiltroTransacaoDto]),
    __metadata("design:returntype", void 0)
], TransacaoController.prototype, "listar", null);
__decorate([
    (0, common_1.Get)('resumo-mensal'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('meses')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TransacaoController.prototype, "resumoMensal", null);
__decorate([
    (0, common_1.Get)('resumo-categorias'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('dataInicio')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TransacaoController.prototype, "resumoCategorias", null);
__decorate([
    (0, common_1.Patch)(':id/categoria'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, AjustarCategoriaDto]),
    __metadata("design:returntype", void 0)
], TransacaoController.prototype, "ajustarCategoria", null);
__decorate([
    (0, common_1.Post)('sincronizar'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TransacaoController.prototype, "sincronizar", null);
exports.TransacaoController = TransacaoController = __decorate([
    (0, common_1.Controller)('transacoes'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [transacao_service_js_1.TransacaoService])
], TransacaoController);
//# sourceMappingURL=transacao.controller.js.map