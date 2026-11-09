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
exports.ContaService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../audit/audit.service");
const prisma_service_1 = require("../prisma/prisma.service");
let ContaService = class ContaService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async saldoConsolidado(usuarioId, ip) {
        const contas = await this.prisma.contaBancaria.findMany({
            where: {
                consentimento: { usuarioId, status: 'ATIVO' },
            },
            include: {
                consentimento: {
                    include: { instituicao: { select: { nome: true, logoUrl: true } } },
                },
            },
        });
        const total = contas.reduce((acc, c) => acc + Number(c.saldoAtual), 0);
        const porInstituicao = Object.values(contas.reduce((acc, c) => {
            const { nome, logoUrl } = c.consentimento.instituicao;
            if (!acc[nome])
                acc[nome] = { nome, logoUrl: logoUrl ?? null, saldo: 0 };
            acc[nome].saldo += Number(c.saldoAtual);
            return acc;
        }, {}));
        const ultimaSincronizacao = contas.reduce((latest, c) => {
            if (!c.ultimaSincronizacao)
                return latest;
            return !latest || c.ultimaSincronizacao > latest ? c.ultimaSincronizacao : latest;
        }, null);
        await this.audit.registrar(usuarioId, 'CONSULTA_SALDO', 'conta', ip);
        return { total, porInstituicao, ultimaSincronizacao };
    }
    async listar(usuarioId, ip) {
        const contas = await this.prisma.contaBancaria.findMany({
            where: {
                consentimento: { usuarioId, status: 'ATIVO' },
            },
            include: {
                consentimento: {
                    include: { instituicao: { select: { id: true, nome: true, logoUrl: true } } },
                },
            },
            orderBy: { ultimaSincronizacao: 'desc' },
        });
        await this.audit.registrar(usuarioId, 'CONSULTA_CONTAS', 'conta', ip);
        return contas;
    }
};
exports.ContaService = ContaService;
exports.ContaService = ContaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ContaService);
//# sourceMappingURL=conta.service.js.map