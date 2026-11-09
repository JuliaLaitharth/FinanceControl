import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRegraAlertaDto } from './dto/create-regra-alerta.dto.js';
import { UpdateRegraAlertaDto } from './dto/update-regra-alerta.dto.js';
export declare class RegraAlertaService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    criar(dto: CreateRegraAlertaDto, usuarioId: number, ip?: string): Promise<{
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
    listar(usuarioId: number): Promise<({
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
    atualizar(id: number, dto: UpdateRegraAlertaDto, usuarioId: number, ip?: string): Promise<{
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
    excluir(id: number, usuarioId: number, ip?: string): Promise<void>;
    private garantirProprietario;
}
