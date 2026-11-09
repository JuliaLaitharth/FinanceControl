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
var SyncWorkerProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncWorkerProcessor = exports.PLUGGY_SYNC_QUEUE = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const alexa_service_js_1 = require("../alexa/alexa.service.js");
const fcm_service_js_1 = require("../fcm/fcm.service.js");
const notificacao_service_js_1 = require("../notificacao/notificacao.service.js");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const transacao_service_js_1 = require("../transacao/transacao.service.js");
exports.PLUGGY_SYNC_QUEUE = 'pluggy-sync';
let SyncWorkerProcessor = SyncWorkerProcessor_1 = class SyncWorkerProcessor extends bullmq_1.WorkerHost {
    prisma;
    transacaoService;
    notificacaoService;
    fcmService;
    alexaService;
    logger = new common_1.Logger(SyncWorkerProcessor_1.name);
    constructor(prisma, transacaoService, notificacaoService, fcmService, alexaService) {
        super();
        this.prisma = prisma;
        this.transacaoService = transacaoService;
        this.notificacaoService = notificacaoService;
        this.fcmService = fcmService;
        this.alexaService = alexaService;
    }
    async process(job) {
        const { usuarioId, event } = job.data;
        this.logger.log(`Processando job ${job.id} — evento: ${event}, usuário: ${usuarioId}`);
        const { sincronizadas } = await this.transacaoService.sincronizar(usuarioId);
        this.logger.log(`Sincronizadas ${sincronizadas} transações`);
        if (sincronizadas === 0)
            return;
        const corte = new Date(Date.now() - 2 * 60 * 1000);
        const txsRecentes = await this.prisma.transacao.findMany({
            where: {
                conta: { consentimento: { usuarioId, status: 'ATIVO' } },
                data: { gte: corte },
            },
            include: { conta: true },
        });
        const contas = await this.prisma.contaBancaria.findMany({
            where: { consentimento: { usuarioId, status: 'ATIVO' } },
        });
        const regras = await this.prisma.regraAlerta.findMany({
            where: { usuarioId, ativa: true },
        });
        const usuario = await this.prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { fcmToken: true, nome: true },
        });
        for (const regra of regras) {
            if (regra.tipoEvento === 'SALDO_MINIMO') {
                await this.avaliarSaldoMinimo(regra, contas, usuario?.fcmToken ?? null);
                continue;
            }
            for (const tx of txsRecentes) {
                if (await this.regraCorresponde(regra, tx)) {
                    const notif = await this.notificacaoService.criarIdempotente({
                        regraId: regra.id,
                        transacaoId: tx.id,
                        mensagem: this.gerarMensagem(regra, tx),
                        canal: regra.canal,
                    });
                    if (notif && usuario?.fcmToken && regra.canal !== 'EMAIL') {
                        const enviado = await this.fcmService.enviar(usuario.fcmToken, 'Alerta Financeiro', notif.mensagem);
                        await this.notificacaoService.atualizarStatus(notif.id, enviado ? 'ENVIADO' : 'FALHA', new Date());
                    }
                    if (notif) {
                        await this.alexaService.enviarAlertaTransacao(usuarioId, notif.mensagem);
                    }
                }
            }
        }
    }
    async regraCorresponde(regra, tx) {
        const limite = Number(regra.valorLimite ?? 0);
        const valor = Number(tx.valor ?? 0);
        switch (regra.tipoEvento) {
            case 'TRANSACAO_GRANDE':
                return tx.tipo === 'DEBIT' && valor > limite;
            case 'DESPESA_CATEGORIA':
                return tx.tipo === 'DEBIT' && tx.categoriaId === regra.categoriaId && valor > limite;
            default:
                return false;
        }
    }
    async avaliarSaldoMinimo(regra, contas, fcmToken) {
        const limite = Number(regra.valorLimite ?? 0);
        for (const conta of contas) {
            if (Number(conta.saldoAtual) < limite) {
                const jaNot = await this.prisma.notificacao.findFirst({
                    where: {
                        regraId: regra.id,
                        transacaoId: null,
                        dataEnvio: { gte: new Date(Date.now() - 24 * 3_600_000) },
                    },
                });
                if (jaNot)
                    continue;
                const mensagem = `Saldo abaixo do limite: R$ ${Number(conta.saldoAtual).toFixed(2)} (mínimo: R$ ${limite.toFixed(2)})`;
                const notif = await this.notificacaoService.criarIdempotente({
                    regraId: regra.id,
                    transacaoId: null,
                    mensagem,
                    canal: regra.canal,
                });
                if (notif && fcmToken && regra.canal !== 'EMAIL') {
                    const enviado = await this.fcmService.enviar(fcmToken, 'Saldo baixo', mensagem);
                    await this.notificacaoService.atualizarStatus(notif.id, enviado ? 'ENVIADO' : 'FALHA', new Date());
                }
            }
        }
    }
    gerarMensagem(regra, tx) {
        const valor = Number(tx.valor).toFixed(2);
        switch (regra.tipoEvento) {
            case 'TRANSACAO_GRANDE':
                return `Transação de R$ ${valor}: "${tx.descricao}" acima do limite de R$ ${Number(regra.valorLimite).toFixed(2)}`;
            case 'DESPESA_CATEGORIA':
                return `Gasto de R$ ${valor} em "${tx.descricao}" acima do limite da categoria`;
            default:
                return `Alerta: R$ ${valor} — "${tx.descricao}"`;
        }
    }
};
exports.SyncWorkerProcessor = SyncWorkerProcessor;
exports.SyncWorkerProcessor = SyncWorkerProcessor = SyncWorkerProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(exports.PLUGGY_SYNC_QUEUE, {
        concurrency: 2,
    }),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        transacao_service_js_1.TransacaoService,
        notificacao_service_js_1.NotificacaoService,
        fcm_service_js_1.FcmService,
        alexa_service_js_1.AlexaService])
], SyncWorkerProcessor);
//# sourceMappingURL=worker.processor.js.map