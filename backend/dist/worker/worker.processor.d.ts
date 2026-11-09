import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AlexaService } from '../alexa/alexa.service.js';
import { FcmService } from '../fcm/fcm.service.js';
import { NotificacaoService } from '../notificacao/notificacao.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TransacaoService } from '../transacao/transacao.service.js';
export interface PluggySyncJobData {
    usuarioId: number;
    event: string;
}
export declare const PLUGGY_SYNC_QUEUE = "pluggy-sync";
export declare class SyncWorkerProcessor extends WorkerHost {
    private readonly prisma;
    private readonly transacaoService;
    private readonly notificacaoService;
    private readonly fcmService;
    private readonly alexaService;
    private readonly logger;
    constructor(prisma: PrismaService, transacaoService: TransacaoService, notificacaoService: NotificacaoService, fcmService: FcmService, alexaService: AlexaService);
    process(job: Job<PluggySyncJobData>): Promise<void>;
    private regraCorresponde;
    private avaliarSaldoMinimo;
    private gerarMensagem;
}
