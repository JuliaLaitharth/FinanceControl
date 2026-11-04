import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrar(usuarioId: number, acao: string, recurso: string, ip?: string) {
    try {
      await this.prisma.logAuditoria.create({
        data: { usuarioId, acao, recurso, ip },
      });
    } catch (erro) {
      this.logger.error(`Falha ao registrar auditoria (${acao})`, (erro as Error).stack);
    }
  }
}