import { AuditService } from '../audit/audit.service.js';
import { EncryptionService } from '../encryption/encryption.service.js';
import { PluggyAdapter } from '../pluggy/pluggy.adapter.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { FiltroTransacaoDto } from './dto/filtro-transacao.dto.js';
export declare class TransacaoService {
    private readonly prisma;
    private readonly pluggy;
    private readonly encryption;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, pluggy: PluggyAdapter, encryption: EncryptionService, audit: AuditService);
    listar(usuarioId: number, filtro: FiltroTransacaoDto): Promise<{
        dados: ({
            categoria: {
                nome: string;
                icone: string | null;
            } | null;
            conta: {
                consentimento: {
                    instituicao: {
                        nome: string;
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
                numeroMascarado: string | null;
            };
        } & {
            id: number;
            data: Date;
            tipo: string;
            idExternoPluggy: string;
            categoriaId: number | null;
            contaId: number;
            descricao: string;
            valor: import("@prisma/client/runtime/library").Decimal;
            metodoPagamento: string | null;
            categoriaAjustadaManualmente: boolean;
        })[];
        total: number;
        pagina: number;
        porPagina: number;
        totalPaginas: number;
    }>;
    sincronizar(usuarioId: number, ip?: string): Promise<{
        sincronizadas: number;
    }>;
    resumoMensal(usuarioId: number, meses?: number): Promise<{
        meses: Array<{
            mes: string;
            receitas: number;
            despesas: number;
            saldo: number;
        }>;
    }>;
    resumoCategorias(usuarioId: number, dataInicio?: string): Promise<{
        categorias: Array<{
            nome: string;
            total: number;
        }>;
    }>;
    ajustarCategoria(transacaoId: number, categoriaId: number, usuarioId: number): Promise<{
        id: number;
        data: Date;
        tipo: string;
        idExternoPluggy: string;
        categoriaId: number | null;
        contaId: number;
        descricao: string;
        valor: import("@prisma/client/runtime/library").Decimal;
        metodoPagamento: string | null;
        categoriaAjustadaManualmente: boolean;
    }>;
    private categorizarAuto;
}
