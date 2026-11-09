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
exports.RegraCategorizacaoService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_js_1 = require("../audit/audit.service.js");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let RegraCategorizacaoService = class RegraCategorizacaoService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async criar(dto, usuarioId, ip) {
        const regra = await this.prisma.regraCategorizacao.create({
            data: {
                usuarioId,
                palavra: dto.palavra.toLowerCase().trim(),
                categoriaId: dto.categoriaId,
            },
            include: { categoria: { select: { nome: true } } },
        });
        await this.audit.registrar(usuarioId, 'REGRA_CAT_CRIADA', 'regra_categorizacao', ip);
        return regra;
    }
    async listar(usuarioId) {
        return this.prisma.regraCategorizacao.findMany({
            where: { usuarioId },
            include: { categoria: { select: { nome: true } } },
            orderBy: { id: 'asc' },
        });
    }
    async excluir(id, usuarioId, ip) {
        const regra = await this.prisma.regraCategorizacao.findUnique({ where: { id } });
        if (!regra)
            throw new common_1.NotFoundException('Regra de categorização não encontrada');
        if (regra.usuarioId !== usuarioId)
            throw new common_1.ForbiddenException();
        await this.prisma.regraCategorizacao.delete({ where: { id } });
        await this.audit.registrar(usuarioId, 'REGRA_CAT_EXCLUIDA', 'regra_categorizacao', ip);
    }
};
exports.RegraCategorizacaoService = RegraCategorizacaoService;
exports.RegraCategorizacaoService = RegraCategorizacaoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        audit_service_js_1.AuditService])
], RegraCategorizacaoService);
//# sourceMappingURL=regra-categorizacao.service.js.map