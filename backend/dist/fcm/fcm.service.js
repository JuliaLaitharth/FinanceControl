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
var FcmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FcmService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let FcmService = FcmService_1 = class FcmService {
    logger = new common_1.Logger(FcmService_1.name);
    messaging = null;
    constructor(config) {
        const rawKey = config.get('FCM_SERVER_KEY');
        if (!rawKey) {
            this.logger.warn('FCM_SERVER_KEY não configurado — push notifications desativadas');
            return;
        }
        try {
            const json = rawKey.startsWith('{') ? rawKey : Buffer.from(rawKey, 'base64').toString();
            const serviceAccount = JSON.parse(json);
            import('firebase-admin').then((admin) => {
                const app = admin.default.initializeApp({
                    credential: admin.default.credential.cert(serviceAccount),
                });
                this.messaging = async (token, title, body) => {
                    await admin.default.messaging(app).send({ token, notification: { title, body } });
                };
                this.logger.log('Firebase Admin SDK inicializado com sucesso');
            }).catch((err) => {
                this.logger.warn(`Falha ao inicializar Firebase Admin SDK: ${String(err)}`);
            });
        }
        catch (err) {
            this.logger.warn(`Credenciais FCM inválidas: ${String(err)}`);
        }
    }
    async enviar(fcmToken, titulo, corpo) {
        if (!this.messaging)
            return false;
        try {
            await this.messaging(fcmToken, titulo, corpo);
            return true;
        }
        catch (err) {
            this.logger.warn(`Falha ao enviar push para token ...${fcmToken.slice(-8)}: ${String(err)}`);
            return false;
        }
    }
};
exports.FcmService = FcmService;
exports.FcmService = FcmService = FcmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FcmService);
//# sourceMappingURL=fcm.service.js.map