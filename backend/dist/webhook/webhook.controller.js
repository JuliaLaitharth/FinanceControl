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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_2 = require("bullmq");
const crypto_1 = require("crypto");
const worker_processor_js_1 = require("../worker/worker.processor.js");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let WebhookController = WebhookController_1 = class WebhookController {
    syncQueue;
    prisma;
    logger = new common_1.Logger(WebhookController_1.name);
    secret;
    constructor(config, syncQueue, prisma) {
        this.syncQueue = syncQueue;
        this.prisma = prisma;
        this.secret = config.getOrThrow('PLUGGY_WEBHOOK_SECRET');
    }
    async handlePluggy(payload, signature, raw) {
        this.validarAssinatura(raw ?? JSON.stringify(payload), signature);
        const rawItemId = payload.item?.id ?? payload.itemId;
        this.logger.log(`Webhook Pluggy: evento=${payload.event} itemId=${rawItemId ?? 'n/a'}`);
        if (rawItemId) {
            const itemIdHash = (0, crypto_1.createHash)('sha256').update(rawItemId).digest('hex');
            const consentimento = await this.prisma.consentimento.findFirst({
                where: { itemIdHash },
                select: { usuarioId: true },
            });
            if (consentimento) {
                await this.syncQueue.add('sync', { usuarioId: consentimento.usuarioId, event: payload.event }, {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5_000 },
                    removeOnComplete: 100,
                    removeOnFail: 50,
                });
                this.logger.log(`Job enfileirado para usuário ${consentimento.usuarioId}`);
            }
            else {
                this.logger.warn(`Nenhum consentimento encontrado para itemIdHash — evento ignorado`);
            }
        }
        return { received: true };
    }
    validarAssinatura(body, signature) {
        if (!signature)
            throw new common_1.UnauthorizedException('Assinatura do webhook ausente');
        const esperado = (0, crypto_1.createHmac)('sha256', this.secret).update(body).digest('hex');
        const sigBuffer = Buffer.from(signature);
        const expBuffer = Buffer.from(esperado);
        if (sigBuffer.length !== expBuffer.length ||
            !(0, crypto_1.timingSafeEqual)(sigBuffer, expBuffer)) {
            throw new common_1.UnauthorizedException('Assinatura do webhook inválida');
        }
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Post)('pluggy'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-pluggy-signature')),
    __param(2, (0, common_1.Body)('_raw')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handlePluggy", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __param(1, (0, bullmq_1.InjectQueue)(worker_processor_js_1.PLUGGY_SYNC_QUEUE)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        bullmq_2.Queue,
        prisma_service_js_1.PrismaService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map