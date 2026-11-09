import { ConsentimentoService } from './consentimento.service';
import { CreateConsentimentoDto } from './dto/create-consentimento.dto';
interface AuthRequest {
    user: {
        userId: number;
    };
}
export declare class ConsentimentoController {
    private readonly service;
    constructor(service: ConsentimentoService);
    gerarConnectToken(req: AuthRequest): Promise<{
        connectToken: string;
    }>;
    criar(dto: CreateConsentimentoDto, req: AuthRequest, ip: string): Promise<{
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
    listar(req: AuthRequest): Promise<({
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
    revogar(id: number, req: AuthRequest, ip: string): Promise<void>;
}
export {};
