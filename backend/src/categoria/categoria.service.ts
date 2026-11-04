import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriaService {
  constructor(private readonly prisma: PrismaService) {}

  /** Retorna categorias do sistema + categorias customizadas do usuário. */
  async listar(usuarioId: number) {
    return this.prisma.categoria.findMany({
      where: {
        OR: [{ padraoSistema: true }, { usuarioId }],
      },
      select: { id: true, nome: true, tipo: true, icone: true, padraoSistema: true },
      orderBy: [{ padraoSistema: 'desc' }, { nome: 'asc' }],
    });
  }
}
