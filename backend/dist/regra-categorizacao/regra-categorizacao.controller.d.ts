import { CreateRegraCategoriacaoDto } from './dto/create-regra-categorizacao.dto.js';
import { RegraCategorizacaoService } from './regra-categorizacao.service.js';
export declare class RegraCategorizacaoController {
    private readonly service;
    constructor(service: RegraCategorizacaoService);
    criar(req: {
        user: {
            sub: number;
        };
    }, dto: CreateRegraCategoriacaoDto, ip: string): Promise<{
        categoria: {
            nome: string;
        };
    } & {
        id: number;
        usuarioId: number;
        categoriaId: number;
        palavra: string;
    }>;
    listar(req: {
        user: {
            sub: number;
        };
    }): Promise<({
        categoria: {
            nome: string;
        };
    } & {
        id: number;
        usuarioId: number;
        categoriaId: number;
        palavra: string;
    })[]>;
    excluir(req: {
        user: {
            sub: number;
        };
    }, id: number, ip: string): Promise<void>;
}
