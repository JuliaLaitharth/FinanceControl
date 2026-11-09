import { CreateRegraAlertaDto } from './dto/create-regra-alerta.dto.js';
import { UpdateRegraAlertaDto } from './dto/update-regra-alerta.dto.js';
import { RegraAlertaService } from './regra-alerta.service.js';
export declare class RegraAlertaController {
    private readonly service;
    constructor(service: RegraAlertaService);
    criar(dto: CreateRegraAlertaDto, req: {
        user: {
            sub: number;
        };
        ip: string;
    }): Promise<{
        id: number;
        usuarioId: number;
        ativa: boolean;
        canal: string;
        tipoEvento: string;
        operador: string | null;
        valorLimite: import("@prisma/client/runtime/library").Decimal | null;
        categoriaId: number | null;
        dataCriacao: Date;
    }>;
    listar(req: {
        user: {
            sub: number;
        };
    }): Promise<({
        categoria: {
            nome: string;
            icone: string | null;
        } | null;
    } & {
        id: number;
        usuarioId: number;
        ativa: boolean;
        canal: string;
        tipoEvento: string;
        operador: string | null;
        valorLimite: import("@prisma/client/runtime/library").Decimal | null;
        categoriaId: number | null;
        dataCriacao: Date;
    })[]>;
    atualizar(id: number, dto: UpdateRegraAlertaDto, req: {
        user: {
            sub: number;
        };
        ip: string;
    }): Promise<{
        id: number;
        usuarioId: number;
        ativa: boolean;
        canal: string;
        tipoEvento: string;
        operador: string | null;
        valorLimite: import("@prisma/client/runtime/library").Decimal | null;
        categoriaId: number | null;
        dataCriacao: Date;
    }>;
    excluir(id: number, req: {
        user: {
            sub: number;
        };
        ip: string;
    }): Promise<void>;
}
