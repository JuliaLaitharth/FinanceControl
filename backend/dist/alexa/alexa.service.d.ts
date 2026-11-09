import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class AlexaService {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    private readonly clientId;
    private readonly clientSecret;
    constructor(prisma: PrismaService, config: ConfigService);
    enviarAlertaTransacao(usuarioId: number, mensagem: string): Promise<void>;
    private obterLwaToken;
    private enviarEvento;
}
