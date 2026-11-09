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
exports.RegraAlertaController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_js_1 = require("../auth/jwt-auth.guard.js");
const create_regra_alerta_dto_js_1 = require("./dto/create-regra-alerta.dto.js");
const update_regra_alerta_dto_js_1 = require("./dto/update-regra-alerta.dto.js");
const regra_alerta_service_js_1 = require("./regra-alerta.service.js");
let RegraAlertaController = class RegraAlertaController {
    service;
    constructor(service) {
        this.service = service;
    }
    criar(dto, req) {
        return this.service.criar(dto, req.user.sub, req.ip);
    }
    listar(req) {
        return this.service.listar(req.user.sub);
    }
    atualizar(id, dto, req) {
        return this.service.atualizar(id, dto, req.user.sub, req.ip);
    }
    excluir(id, req) {
        return this.service.excluir(id, req.user.sub, req.ip);
    }
};
exports.RegraAlertaController = RegraAlertaController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_regra_alerta_dto_js_1.CreateRegraAlertaDto, Object]),
    __metadata("design:returntype", void 0)
], RegraAlertaController.prototype, "criar", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RegraAlertaController.prototype, "listar", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_regra_alerta_dto_js_1.UpdateRegraAlertaDto, Object]),
    __metadata("design:returntype", void 0)
], RegraAlertaController.prototype, "atualizar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], RegraAlertaController.prototype, "excluir", null);
exports.RegraAlertaController = RegraAlertaController = __decorate([
    (0, common_1.Controller)('regras-alerta'),
    (0, common_1.UseGuards)(jwt_auth_guard_js_1.JwtAuthGuard),
    __metadata("design:paramtypes", [regra_alerta_service_js_1.RegraAlertaService])
], RegraAlertaController);
//# sourceMappingURL=regra-alerta.controller.js.map