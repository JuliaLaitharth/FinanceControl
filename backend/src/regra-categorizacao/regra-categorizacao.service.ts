import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRegraCategoriacaoDto } from './dto/create-regra-categorizacao.dto.js';

@Injectable()
export class RegraCategorizacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async criar(dto: CreateRegraCategoriacaoDto, usuarioId: number, ip?: string) {
    const regra = await this.prisma.regraCategorizacao.create({
      data: {
        usuarioId,
        palavra: dto.palavra.toLowerCase().trim(),
        categoriaId: dto.categoriaId,
      },
      include: { categoria: { select: { nome: true } } },
    });
    await this.audit.registrar(usuarioId, 'REGRA_CAT_CRIADA', 'regra_categorizacao', ip);
    return regra;
  }

  async listar(usuarioId: number) {
    return this.prisma.regraCategorizacao.findMany({
      where: { usuarioId },
      include: { categoria: { select: { nome: true } } },
      orderBy: { id: 'asc' },
    });
  }

  async excluir(id: number, usuarioId: number, ip?: string): Promise<void> {
    const regra = await this.prisma.regraCategorizacao.findUnique({ where: { id } });
    if (!regra) throw new NotFoundException('Regra de categorização não encontrada');
    if (regra.usuarioId !== usuarioId) throw new ForbiddenException();

    await this.prisma.regraCategorizacao.delete({ where: { id } });
    await this.audit.registrar(usuarioId, 'REGRA_CAT_EXCLUIDA', 'regra_categorizacao', ip);
  }
}
