import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../encryption/encryption.service';
import { PluggyAdapter } from '../pluggy/pluggy.adapter';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentimentoDto } from './dto/create-consentimento.dto';
export declare class ConsentimentoService {
    private readonly prisma;
    private readonly pluggy;
    private readonly encryption;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, pluggy: PluggyAdapter, encryption: EncryptionService, audit: AuditService);
    gerarConnectToken(usuarioId: number): Promise<{
        connectToken: string;
    }>;
    criar(dto: CreateConsentimentoDto, usuarioId: number, ip?: string): Promise<{
        instituicao: {
            nome: string;
            logoUrl: string | null;
        };
        contas: {
            id: number;
            tipo: string;
            consentimentoId: number;
            idExternoPluggy: string;
            numeroMascarado: string | null;
            saldoAtual: import("@prisma/client/runtime/library").Decimal;
            moeda: string;
            ultimaSincronizacao: Date | null;
        }[];
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
    }>;
    listar(usuarioId: number): Promise<({
        instituicao: {
            nome: string;
            logoUrl: string | null;
        };
        contas: {
            id: number;
            tipo: string;
            numeroMascarado: string | null;
            saldoAtual: import("@prisma/client/runtime/library").Decimal;
            moeda: string;
            ultimaSincronizacao: Date | null;
        }[];
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
    })[]>;
    revogar(consentimentoId: number, usuarioId: number, ip?: string): Promise<void>;
    private buscarPorId;
}
