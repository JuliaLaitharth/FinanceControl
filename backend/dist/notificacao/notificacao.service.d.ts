import { PrismaService } from '../prisma/prisma.service.js';
export declare class NotificacaoService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listar(usuarioId: number, apenasNaoLidas?: boolean): Promise<({
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
    contarNaoLidas(usuarioId: number): Promise<number>;
    marcarComoLida(id: number, usuarioId: number): Promise<{
        id: number;
        regraId: number;
        transacaoId: number | null;
        mensagem: string;
        canal: string;
        statusEnvio: string;
        dataEnvio: Date | null;
        lida: boolean;
    } | null>;
    marcarTodasComoLidas(usuarioId: number): Promise<{
        atualizadas: number;
    }>;
    criarIdempotente(params: {
        regraId: number;
        transacaoId: number | null;
        mensagem: string;
        canal: string;
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
    atualizarStatus(id: number, status: 'ENVIADO' | 'FALHA', dataEnvio?: Date): Promise<{
        id: number;
        regraId: number;
        transacaoId: number | null;
        mensagem: string;
        canal: string;
        statusEnvio: string;
        dataEnvio: Date | null;
        lida: boolean;
    }>;
}
