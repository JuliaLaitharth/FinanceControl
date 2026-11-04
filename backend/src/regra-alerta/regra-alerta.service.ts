import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRegraAlertaDto } from './dto/create-regra-alerta.dto.js';
import { UpdateRegraAlertaDto } from './dto/update-regra-alerta.dto.js';

@Injectable()
export class RegraAlertaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async criar(dto: CreateRegraAlertaDto, usuarioId: number, ip?: string) {
    const regra = await this.prisma.regraAlerta.create({
      data: {
        usuarioId,
        tipoEvento: dto.tipoEvento,
        operador: dto.operador ?? null,
        valorLimite: dto.valorLimite ?? null,
        categoriaId: dto.categoriaId ?? null,
        canal: dto.canal,
      },
    });
    await this.audit.registrar(usuarioId, 'REGRA_CRIADA', 'regra_alerta', ip);
    return regra;
  }

  async listar(usuarioId: number) {
    return this.prisma.regraAlerta.findMany({
      where: { usuarioId },
      include: { categoria: { select: { nome: true, icone: true } } },
      orderBy: { dataCriacao: 'desc' },
    });
  }

  async atualizar(
    id: number,
    dto: UpdateRegraAlertaDto,
    usuarioId: number,
    ip?: string,
  ) {
    await this.garantirProprietario(id, usuarioId);
    const regra = await this.prisma.regraAlerta.update({
      where: { id },
      data: {
        ...(dto.tipoEvento ? { tipoEvento: dto.tipoEvento } : {}),
        ...(dto.operador !== undefined ? { operador: dto.operador } : {}),
        ...(dto.valorLimite !== undefined ? { valorLimite: dto.valorLimite } : {}),
        ...(dto.categoriaId !== undefined ? { categoriaId: dto.categoriaId } : {}),
        ...(dto.canal ? { canal: dto.canal } : {}),
        ...(dto.ativa !== undefined ? { ativa: dto.ativa } : {}),
      },
    });
    await this.audit.registrar(usuarioId, 'REGRA_ATUALIZADA', 'regra_alerta', ip);
    return regra;
  }

  async excluir(id: number, usuarioId: number, ip?: string): Promise<void> {
    await this.garantirProprietario(id, usuarioId);
    await this.prisma.regraAlerta.delete({ where: { id } });
    await this.audit.registrar(usuarioId, 'REGRA_EXCLUIDA', 'regra_alerta', ip);
  }

  private async garantirProprietario(id: number, usuarioId: number) {
    const regra = await this.prisma.regraAlerta.findUnique({ where: { id } });
    if (!regra) throw new NotFoundException('Regra de alerta não encontrada');
    if (regra.usuarioId !== usuarioId) throw new ForbiddenException();
    return regra;
  }
}
