import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    registrar(usuarioId: number, acao: string, recurso: string, ip?: string): Promise<void>;
}
