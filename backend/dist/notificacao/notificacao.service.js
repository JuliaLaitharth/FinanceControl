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
exports.NotificacaoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let NotificacaoService = class NotificacaoService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listar(usuarioId, apenasNaoLidas = false) {
        return this.prisma.notificacao.findMany({
            where: {
                regra: { usuarioId },
                ...(apenasNaoLidas ? { lida: false } : {}),
            },
            include: {
                regra: { select: { tipoEvento: true, canal: true } },
                transacao: { select: { descricao: true, valor: true, tipo: true, data: true } },
            },
            orderBy: { dataEnvio: 'desc' },
            take: 50,
        });
    }
    async contarNaoLidas(usuarioId) {
        return this.prisma.notificacao.count({
            where: { regra: { usuarioId }, lida: false },
        });
    }
    async marcarComoLida(id, usuarioId) {
        const notif = await this.prisma.notificacao.findFirst({
            where: { id, regra: { usuarioId } },
        });
        if (!notif)
            return null;
        return this.prisma.notificacao.update({
            where: { id },
            data: { lida: true },
        });
    }
    async marcarTodasComoLidas(usuarioId) {
        const { count } = await this.prisma.notificacao.updateMany({
            where: { regra: { usuarioId }, lida: false },
            data: { lida: true },
        });
        return { atualizadas: count };
    }
    async criarIdempotente(params) {
        try {
            return await this.prisma.notificacao.create({
                data: {
                    regraId: params.regraId,
                    transacaoId: params.transacaoId,
                    mensagem: params.mensagem,
                    canal: params.canal,
                    statusEnvio: 'PENDENTE',
                },
            });
        }
        catch {
            return null;
        }
    }
    async atualizarStatus(id, status, dataEnvio) {
        return this.prisma.notificacao.update({
            where: { id },
            data: { statusEnvio: status, dataEnvio: dataEnvio ?? new Date() },
        });
    }
};
exports.NotificacaoService = NotificacaoService;
exports.NotificacaoService = NotificacaoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService])
], NotificacaoService);
//# sourceMappingURL=notificacao.service.js.map