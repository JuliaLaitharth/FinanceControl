declare class AjustarCategoriaDto {
    categoriaId: number;
}
import { FiltroTransacaoDto } from './dto/filtro-transacao.dto.js';
import { TransacaoService } from './transacao.service.js';
export declare class TransacaoController {
    private readonly service;
    constructor(service: TransacaoService);
    listar(req: {
        user: {
            sub: number;
        };
    }, filtro: FiltroTransacaoDto): Promise<{
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
    resumoMensal(req: {
        user: {
            sub: number;
        };
    }, meses?: string): Promise<{
        meses: Array<{
            mes: string;
            receitas: number;
            despesas: number;
            saldo: number;
        }>;
    }>;
    resumoCategorias(req: {
        user: {
            sub: number;
        };
    }, dataInicio?: string): Promise<{
        categorias: Array<{
            nome: string;
            total: number;
        }>;
    }>;
    ajustarCategoria(req: {
        user: {
            sub: number;
        };
    }, id: number, dto: AjustarCategoriaDto): Promise<{
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
    sincronizar(req: {
        user: {
            sub: number;
        };
        ip: string;
    }): Promise<{
        sincronizadas: number;
    }>;
}
export {};
