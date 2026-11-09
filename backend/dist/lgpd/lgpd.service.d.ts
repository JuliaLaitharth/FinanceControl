import { AuditService } from '../audit/audit.service.js';
import { EncryptionService } from '../encryption/encryption.service.js';
import { PluggyAdapter } from '../pluggy/pluggy.adapter.js';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class LgpdService {
    private readonly prisma;
    private readonly pluggy;
    private readonly encryption;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, pluggy: PluggyAdapter, encryption: EncryptionService, audit: AuditService);
    excluirConta(usuarioId: number, ip?: string): Promise<void>;
}
