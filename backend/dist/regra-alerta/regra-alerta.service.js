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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegraAlertaService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_js_1 = require("../audit/audit.service.js");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let RegraAlertaService = class RegraAlertaService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async criar(dto, usuarioId, ip) {
        const regra = await this.prisma.regraAlerta.create({
            data: {
                usuarioId,
                tipoEvento: dto.tipoEvento,
                operador: dto.operador ?? null,
                valorLimite: dto.valorLimite ?? null,
                categoriaId: dto.categoriaId ?? null,
                canal: dto.canal,
            },
        });
        await this.audit.registrar(usuarioId, 'REGRA_CRIADA', 'regra_alerta', ip);
        return regra;
    }
    async listar(usuarioId) {
        return this.prisma.regraAlerta.findMany({
            where: { usuarioId },
            include: { categoria: { select: { nome: true, icone: true } } },
            orderBy: { dataCriacao: 'desc' },
        });
    }
    async atualizar(id, dto, usuarioId, ip) {
        await this.garantirProprietario(id, usuarioId);
        const regra = await this.prisma.regraAlerta.update({
            where: { id },
            data: {
                ...(dto.tipoEvento ? { tipoEvento: dto.tipoEvento } : {}),
                ...(dto.operador !== undefined ? { operador: dto.operador } : {}),
                ...(dto.valorLimite !== undefined ? { valorLimite: dto.valorLimite } : {}),
                ...(dto.categoriaId !== undefined ? { categoriaId: dto.categoriaId } : {}),
                ...(dto.canal ? { canal: dto.canal } : {}),
                ...(dto.ativa !== undefined ? { ativa: dto.ativa } : {}),
            },
        });
        await this.audit.registrar(usuarioId, 'REGRA_ATUALIZADA', 'regra_alerta', ip);
        return regra;
    }
    async excluir(id, usuarioId, ip) {
        await this.garantirProprietario(id, usuarioId);
        await this.prisma.regraAlerta.delete({ where: { id } });
        await this.audit.registrar(usuarioId, 'REGRA_EXCLUIDA', 'regra_alerta', ip);
    }
    async garantirProprietario(id, usuarioId) {
        const regra = await this.prisma.regraAlerta.findUnique({ where: { id } });
        if (!regra)
            throw new common_1.NotFoundException('Regra de alerta não encontrada');
        if (regra.usuarioId !== usuarioId)
            throw new common_1.ForbiddenException();
        return regra;
    }
};
exports.RegraAlertaService = RegraAlertaService;
exports.RegraAlertaService = RegraAlertaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        audit_service_js_1.AuditService])
], RegraAlertaService);
//# sourceMappingURL=regra-alerta.service.js.map