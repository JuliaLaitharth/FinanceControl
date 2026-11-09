"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerModule = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const notificacao_module_js_1 = require("../notificacao/notificacao.module.js");
const transacao_module_js_1 = require("../transacao/transacao.module.js");
const worker_processor_js_1 = require("./worker.processor.js");
let WorkerModule = class WorkerModule {
};
exports.WorkerModule = WorkerModule;
exports.WorkerModule = WorkerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({ name: worker_processor_js_1.PLUGGY_SYNC_QUEUE }),
            transacao_module_js_1.TransacaoModule,
            notificacao_module_js_1.NotificacaoModule,
        ],
        providers: [worker_processor_js_1.SyncWorkerProcessor],
        exports: [bullmq_1.BullModule],
    })
], WorkerModule);
//# sourceMappingURL=worker.module.js.map