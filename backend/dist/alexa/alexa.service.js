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
var AlexaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlexaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
let AlexaService = AlexaService_1 = class AlexaService {
    prisma;
    config;
    logger = new common_1.Logger(AlexaService_1.name);
    clientId;
    clientSecret;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.clientId = this.config.get('ALEXA_CLIENT_ID');
        this.clientSecret = this.config.get('ALEXA_CLIENT_SECRET');
    }
    async enviarAlertaTransacao(usuarioId, mensagem) {
        if (!this.clientId || !this.clientSecret)
            return;
        const vinculo = await this.prisma.vinculoAlexa.findFirst({
            where: { usuarioId, ativo: true, NOT: { alexaUserId: null } },
        });
        if (!vinculo?.alexaUserId)
            return;
        const lwaToken = await this.obterLwaToken();
        if (!lwaToken)
            return;
        await this.enviarEvento(vinculo.alexaUserId, mensagem, lwaToken);
    }
    async obterLwaToken() {
        try {
            const { default: axios } = await import('axios');
            const params = new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret,
                scope: 'alexa::proactive_events',
            });
            const { data } = await axios.post('https://api.amazon.com/auth/o2/token', params.toString(), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
            return data.access_token;
        }
        catch (err) {
            this.logger.warn('Falha ao obter token LWA para Proactive Events', err);
            return null;
        }
    }
    async enviarEvento(alexaUserId, mensagem, lwaToken) {
        try {
            const { default: axios } = await import('axios');
            const evento = {
                timestamp: new Date().toISOString(),
                referenceId: `fc-${Date.now()}`,
                payload: {
                    type: 'AMAZON.MessageAlert.Activated',
                    version: '1.0',
                    data: {
                        state: { status: 'UNREAD', freshness: 'NEW' },
                        messageGroup: {
                            creator: { name: 'FinanceControl' },
                            count: 1,
                            urgency: 'URGENT',
                        },
                    },
                },
                relevantAudience: { type: 'Unicast', payload: { user: alexaUserId } },
                expiryTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            };
            await axios.post('https://api.amazonalexa.com/v1/proactiveEvents', evento, { headers: { Authorization: `Bearer ${lwaToken}` } });
            this.logger.log(`Proactive Event enviado para Alexa user: ${alexaUserId}`);
        }
        catch (err) {
            this.logger.warn(`Falha ao enviar Proactive Event para ${alexaUserId}`, err);
        }
    }
};
exports.AlexaService = AlexaService;
exports.AlexaService = AlexaService = AlexaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        config_1.ConfigService])
], AlexaService);
//# sourceMappingURL=alexa.service.js.map