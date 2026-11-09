import { PrismaService } from '../prisma/prisma.service';
export declare class CategoriaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listar(usuarioId: number): Promise<{
        id: number;
        nome: string;
        tipo: string;
        icone: string | null;
        padraoSistema: boolean;
    }[]>;
}
