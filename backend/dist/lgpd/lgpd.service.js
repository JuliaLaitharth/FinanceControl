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
var LgpdService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LgpdService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_js_1 = require("../audit/audit.service.js");
const encryption_service_js_1 = require("../encryption/encryption.service.js");
const pluggy_adapter_js_1 = require("../pluggy/pluggy.adapter.js");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let LgpdService = LgpdService_1 = class LgpdService {
    prisma;
    pluggy;
    encryption;
    audit;
    logger = new common_1.Logger(LgpdService_1.name);
    constructor(prisma, pluggy, encryption, audit) {
        this.prisma = prisma;
        this.pluggy = pluggy;
        this.encryption = encryption;
        this.audit = audit;
    }
    async excluirConta(usuarioId, ip) {
        const consentimentos = await this.prisma.consentimento.findMany({
            where: { usuarioId, status: 'ATIVO' },
        });
        for (const c of consentimentos) {
            try {
                const itemIdDecriptado = this.encryption.decrypt(c.itemIdPluggy);
                await this.pluggy.revogarItem(itemIdDecriptado);
            }
            catch (err) {
                this.logger.warn(`Falha ao revogar item Pluggy na exclusão LGPD: ${String(err)}`);
            }
        }
        await this.audit.registrar(usuarioId, 'CONTA_EXCLUIDA_LGPD', 'usuario', ip);
        await this.prisma.usuario.delete({ where: { id: usuarioId } });
        this.logger.log(`Conta do usuário ${usuarioId} excluída por solicitação LGPD`);
    }
};
exports.LgpdService = LgpdService;
exports.LgpdService = LgpdService = LgpdService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        pluggy_adapter_js_1.PluggyAdapter,
        encryption_service_js_1.EncryptionService,
        audit_service_js_1.AuditService])
], LgpdService);
//# sourceMappingURL=lgpd.service.js.map