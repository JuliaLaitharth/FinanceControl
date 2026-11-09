import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRegraCategoriacaoDto } from './dto/create-regra-categorizacao.dto.js';
export declare class RegraCategorizacaoService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    criar(dto: CreateRegraCategoriacaoDto, usuarioId: number, ip?: string): Promise<{
        categoria: {
            nome: string;
        };
    } & {
        id: number;
        usuarioId: number;
        categoriaId: number;
        palavra: string;
    }>;
    listar(usuarioId: number): Promise<({
        categoria: {
            nome: string;
        };
    } & {
        id: number;
        usuarioId: number;
        categoriaId: number;
        palavra: string;
    })[]>;
    excluir(id: number, usuarioId: number, ip?: string): Promise<void>;
}
