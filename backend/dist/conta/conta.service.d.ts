import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class ContaService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    saldoConsolidado(usuarioId: number, ip?: string): Promise<{
        total: number;
        porInstituicao: {
            nome: string;
            logoUrl: string | null;
            saldo: number;
        }[];
        ultimaSincronizacao: Date | null;
    }>;
    listar(usuarioId: number, ip?: string): Promise<({
        consentimento: {
            instituicao: {
                id: number;
                nome: string;
                logoUrl: string | null;
            };
        } & {
            id: number;
            usuarioId: number;
            instituicaoId: number;
            itemIdPluggy: string;
            itemIdHash: string | null;
            status: string;
            dataConsentimento: Date;
            dataExpiracao: Date | null;
            dataRevogacao: Date | null;
        };
    } & {
        id: number;
        tipo: string;
        consentimentoId: number;
        idExternoPluggy: string;
        numeroMascarado: string | null;
        saldoAtual: import("@prisma/client/runtime/library").Decimal;
        moeda: string;
        ultimaSincronizacao: Date | null;
    })[]>;
}
