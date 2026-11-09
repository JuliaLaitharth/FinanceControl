import { CategoriaService } from './categoria.service.js';
export declare class CategoriaController {
    private readonly service;
    constructor(service: CategoriaService);
    listar(req: {
        user: {
            sub: number;
        };
    }): Promise<{
        id: number;
        nome: string;
        tipo: string;
        icone: string | null;
        padraoSistema: boolean;
    }[]>;
}
