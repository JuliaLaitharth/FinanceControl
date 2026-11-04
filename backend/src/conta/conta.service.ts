import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Saldo consolidado: total + saldo por instituição.
   * Considera apenas contas de consentimentos ativos (UC03).
   */
  async saldoConsolidado(usuarioId: number, ip?: string) {
    const contas = await this.prisma.contaBancaria.findMany({
      where: {
        consentimento: { usuarioId, status: 'ATIVO' },
      },
      include: {
        consentimento: {
          include: { instituicao: { select: { nome: true, logoUrl: true } } },
        },
      },
    });

    const total = contas.reduce((acc, c) => acc + Number(c.saldoAtual), 0);

    // Agrupa por instituição
    const porInstituicao = Object.values(
      contas.reduce<
        Record<string, { nome: string; logoUrl: string | null; saldo: number }>
      >((acc, c) => {
        const { nome, logoUrl } = c.consentimento.instituicao;
        if (!acc[nome]) acc[nome] = { nome, logoUrl: logoUrl ?? null, saldo: 0 };
        acc[nome].saldo += Number(c.saldoAtual);
        return acc;
      }, {}),
    );

    const ultimaSincronizacao =
      contas.reduce<Date | null>((latest, c) => {
        if (!c.ultimaSincronizacao) return latest;
        return !latest || c.ultimaSincronizacao > latest ? c.ultimaSincronizacao : latest;
      }, null);

    await this.audit.registrar(usuarioId, 'CONSULTA_SALDO', 'conta', ip);
    return { total, porInstituicao, ultimaSincronizacao };
  }

  /** Lista todas as contas bancárias do usuário com seus consentimentos. */
  async listar(usuarioId: number, ip?: string) {
    const contas = await this.prisma.contaBancaria.findMany({
      where: {
        consentimento: { usuarioId, status: 'ATIVO' },
      },
      include: {
        consentimento: {
          include: { instituicao: { select: { id: true, nome: true, logoUrl: true } } },
        },
      },
      orderBy: { ultimaSincronizacao: 'desc' },
    });

    await this.audit.registrar(usuarioId, 'CONSULTA_CONTAS', 'conta', ip);
    return contas;
  }
}
