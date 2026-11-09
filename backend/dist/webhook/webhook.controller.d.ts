import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service.js';
interface PluggyWebhookPayload {
    event: string;
    item?: {
        id: string;
    };
    itemId?: string;
    [key: string]: unknown;
}
export declare class WebhookController {
    private readonly syncQueue;
    private readonly prisma;
    private readonly logger;
    private readonly secret;
    constructor(config: ConfigService, syncQueue: Queue, prisma: PrismaService);
    handlePluggy(payload: PluggyWebhookPayload, signature: string, raw: string): Promise<{
        received: boolean;
    }>;
    private validarAssinatura;
}
export {};
