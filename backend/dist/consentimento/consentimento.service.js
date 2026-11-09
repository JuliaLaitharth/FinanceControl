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
var ConsentimentoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentimentoService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const audit_service_1 = require("../audit/audit.service");
const encryption_service_1 = require("../encryption/encryption.service");
const pluggy_adapter_1 = require("../pluggy/pluggy.adapter");
const prisma_service_1 = require("../prisma/prisma.service");
let ConsentimentoService = ConsentimentoService_1 = class ConsentimentoService {
    prisma;
    pluggy;
    encryption;
    audit;
    logger = new common_1.Logger(ConsentimentoService_1.name);
    constructor(prisma, pluggy, encryption, audit) {
        this.prisma = prisma;
        this.pluggy = pluggy;
        this.encryption = encryption;
        this.audit = audit;
    }
    async gerarConnectToken(usuarioId) {
        await this.audit.registrar(usuarioId, 'CONNECT_TOKEN_GERADO', 'consentimento');
        const connectToken = await this.pluggy.criarConnectToken();
        return { connectToken };
    }
    async criar(dto, usuarioId, ip) {
        const itemIdDecriptado = dto.itemId;
        const itemIdCriptografado = this.encryption.encrypt(itemIdDecriptado);
        const duplicado = await this.prisma.consentimento.findFirst({
            where: { usuarioId, itemIdPluggy: itemIdCriptografado },
        });
        if (duplicado)
            throw new common_1.ConflictException('Conta já conectada');
        const item = await this.pluggy.buscarItem(itemIdDecriptado);
        const connectorId = String(item.connector.id);
        const nomeInstituicao = item.connector.name;
        const instituicao = await this.prisma.instituicao.upsert({
            where: { codigoPluggy: connectorId },
            update: { nome: nomeInstituicao },
            create: {
                nome: nomeInstituicao,
                codigoPluggy: connectorId,
                logoUrl: item.connector.imageUrl ?? null,
            },
        });
        const itemIdHash = (0, crypto_1.createHash)('sha256').update(itemIdDecriptado).digest('hex');
        const consentimento = await this.prisma.consentimento.create({
            data: {
                usuarioId,
                instituicaoId: instituicao.id,
                itemIdPluggy: itemIdCriptografado,
                itemIdHash,
                status: 'ATIVO',
                dataExpiracao: new Date(Date.now() + 365 * 86_400_000),
            },
        });
        const contasPluggy = await this.pluggy.buscarContas(itemIdDecriptado);
        await this.prisma.contaBancaria.createMany({
            data: contasPluggy.map((c) => ({
                consentimentoId: consentimento.id,
                idExternoPluggy: c.id,
                tipo: c.type,
                numeroMascarado: c.number ?? null,
                saldoAtual: c.balance,
                moeda: c.currencyCode ?? 'BRL',
                ultimaSincronizacao: new Date(),
            })),
            skipDuplicates: true,
        });
        await this.audit.registrar(usuarioId, 'CONSENTIMENTO_CRIADO', 'consentimento', ip);
        this.logger.log(`Consentimento criado: usuário ${usuarioId}, instituição ${nomeInstituicao}`);
        return this.buscarPorId(consentimento.id, usuarioId);
    }
    async listar(usuarioId) {
        return this.prisma.consentimento.findMany({
            where: { usuarioId, status: 'ATIVO' },
            include: {
                instituicao: { select: { nome: true, logoUrl: true } },
                contas: {
                    select: {
                        id: true,
                        tipo: true,
                        numeroMascarado: true,
                        saldoAtual: true,
                        moeda: true,
                        ultimaSincronizacao: true,
                    },
                },
            },
            orderBy: { dataConsentimento: 'desc' },
        });
    }
    async revogar(consentimentoId, usuarioId, ip) {
        const consentimento = await this.buscarPorId(consentimentoId, usuarioId);
        const itemId = this.encryption.decrypt(consentimento.itemIdPluggy);
        await this.pluggy.revogarItem(itemId);
        await this.prisma.consentimento.delete({ where: { id: consentimentoId } });
        await this.audit.registrar(usuarioId, 'CONSENTIMENTO_REVOGADO', 'consentimento', ip);
        this.logger.log(`Consentimento ${consentimentoId} revogado: usuário ${usuarioId}`);
    }
    async buscarPorId(id, usuarioId) {
        const c = await this.prisma.consentimento.findFirst({
            where: { id, usuarioId },
            include: {
                instituicao: { select: { nome: true, logoUrl: true } },
                contas: true,
            },
        });
        if (!c)
            throw new common_1.NotFoundException('Consentimento não encontrado');
        return c;
    }
};
exports.ConsentimentoService = ConsentimentoService;
exports.ConsentimentoService = ConsentimentoService = ConsentimentoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        pluggy_adapter_1.PluggyAdapter,
        encryption_service_1.EncryptionService,
        audit_service_1.AuditService])
], ConsentimentoService);
//# sourceMappingURL=consentimento.service.js.map