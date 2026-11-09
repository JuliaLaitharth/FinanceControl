"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const alexa_module_1 = require("./alexa/alexa.module");
const audit_module_1 = require("./audit/audit.module");
const lgpd_module_1 = require("./lgpd/lgpd.module");
const auth_module_1 = require("./auth/auth.module");
const categoria_module_1 = require("./categoria/categoria.module");
const consentimento_module_1 = require("./consentimento/consentimento.module");
const conta_module_1 = require("./conta/conta.module");
const encryption_module_1 = require("./encryption/encryption.module");
const fcm_module_1 = require("./fcm/fcm.module");
const notificacao_module_1 = require("./notificacao/notificacao.module");
const oauth_module_1 = require("./oauth/oauth.module");
const regra_categorizacao_module_1 = require("./regra-categorizacao/regra-categorizacao.module");
const pluggy_module_1 = require("./pluggy/pluggy.module");
const prisma_module_1 = require("./prisma/prisma.module");
const regra_alerta_module_1 = require("./regra-alerta/regra-alerta.module");
const transacao_module_1 = require("./transacao/transacao.module");
const webhook_module_1 = require("./webhook/webhook.module");
const worker_module_1 = require("./worker/worker.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            bullmq_1.BullModule.forRootAsync({
                useFactory: (config) => ({
                    connection: {
                        host: config.get('REDIS_HOST', 'localhost'),
                        port: config.get('REDIS_PORT', 6379),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            prisma_module_1.PrismaModule,
            encryption_module_1.EncryptionModule,
            audit_module_1.AuditModule,
            fcm_module_1.FcmModule,
            alexa_module_1.AlexaModule,
            auth_module_1.AuthModule,
            pluggy_module_1.PluggyModule,
            consentimento_module_1.ConsentimentoModule,
            conta_module_1.ContaModule,
            webhook_module_1.WebhookModule,
            categoria_module_1.CategoriaModule,
            transacao_module_1.TransacaoModule,
            regra_alerta_module_1.RegraAlertaModule,
            notificacao_module_1.NotificacaoModule,
            oauth_module_1.OauthModule,
            lgpd_module_1.LgpdModule,
            regra_categorizacao_module_1.RegraCategorizacaoModule,
            worker_module_1.WorkerModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map