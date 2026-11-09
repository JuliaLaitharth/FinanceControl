import { NotificacaoService } from './notificacao.service.js';
export declare class NotificacaoController {
    private readonly service;
    constructor(service: NotificacaoService);
    listar(req: {
        user: {
            sub: number;
        };
    }, naoLidas?: string): Promise<({
        transacao: {
            data: Date;
            tipo: string;
            descricao: string;
            valor: import("@prisma/client/runtime/library").Decimal;
        } | null;
        regra: {
            canal: string;
            tipoEvento: string;
        };
    } & {
        id: number;
        regraId: number;
        transacaoId: number | null;
        mensagem: string;
        canal: string;
        statusEnvio: string;
        dataEnvio: Date | null;
        lida: boolean;
    })[]>;
    contar(req: {
        user: {
            sub: number;
        };
    }): Promise<{
        naoLidas: number;
    }>;
    marcarComoLida(id: number, req: {
        user: {
            sub: number;
        };
    }): Promise<{
        id: number;
        regraId: number;
        transacaoId: number | null;
        mensagem: string;
        canal: string;
        statusEnvio: string;
        dataEnvio: Date | null;
        lida: boolean;
    } | null>;
    marcarTodasComoLidas(req: {
        user: {
            sub: number;
        };
    }): Promise<{
        atualizadas: number;
    }>;
}
