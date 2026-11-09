import { ContaService } from './conta.service';
interface AuthRequest {
    user: {
        userId: number;
    };
}
export declare class ContaController {
    private readonly service;
    constructor(service: ContaService);
    saldo(req: AuthRequest, ip: string): Promise<{
        total: number;
        porInstituicao: {
            nome: string;
            logoUrl: string | null;
            saldo: number;
        }[];
        ultimaSincronizacao: Date | null;
    }>;
    listar(req: AuthRequest, ip: string): Promise<({
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
export {};
