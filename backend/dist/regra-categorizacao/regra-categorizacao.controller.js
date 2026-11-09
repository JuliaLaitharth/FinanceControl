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
exports.RegraCategorizacaoController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_js_1 = require("../auth/jwt-auth.guard.js");
const create_regra_categorizacao_dto_js_1 = require("./dto/create-regra-categorizacao.dto.js");
const regra_categorizacao_service_js_1 = require("./regra-categorizacao.service.js");
let RegraCategorizacaoController = class RegraCategorizacaoController {
    service;
    constructor(service) {
        this.service = service;
    }
    criar(req, dto, ip) {
        return this.service.criar(dto, req.user.sub, ip);
    }
    listar(req) {
        return this.service.listar(req.user.sub);
    }
    async excluir(req, id, ip) {
        await this.service.excluir(id, req.user.sub, ip);
    }
};
exports.RegraCategorizacaoController = RegraCategorizacaoController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_regra_categorizacao_dto_js_1.CreateRegraCategoriacaoDto, String]),
    __metadata("design:returntype", void 0)
], RegraCategorizacaoController.prototype, "criar", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RegraCategorizacaoController.prototype, "listar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Ip)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, String]),
    __metadata("design:returntype", Promise)
], RegraCategorizacaoController.prototype, "excluir", null);
exports.RegraCategorizacaoController = RegraCategorizacaoController = __decorate([
    (0, common_1.Controller)('regras-categorizacao'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [regra_categorizacao_service_js_1.RegraCategorizacaoService])
], RegraCategorizacaoController);
//# sourceMappingURL=regra-categorizacao.controller.js.map