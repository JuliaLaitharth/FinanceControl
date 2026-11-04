import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { EncryptionService } from '../encryption/encryption.service.js';
import { PluggyAdapter } from '../pluggy/pluggy.adapter.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { FiltroTransacaoDto } from './dto/filtro-transacao.dto.js';

// Mapa de palavras-chave para auto-categorização (RF05 básico)
const KEYWORDS: Record<string, string[]> = {
  Alimentação: ['mercado', 'supermercado', 'restaurante', 'lanchonete', 'padaria', 'pizza', 'ifood', 'delivery', 'burguer'],
  Transporte: ['uber', '99pop', 'taxi', 'combustivel', 'gasolina', 'etanol', 'posto', 'estacionamento', 'onibus', 'metro'],
  Moradia: ['aluguel', 'condominio', 'iptu', 'energia', 'enel', 'cemig', 'sabesp', 'internet', 'compesa'],
  Saúde: ['farmacia', 'remedio', 'hospital', 'clinica', 'medico', 'exame', 'saude', 'drogaria'],
  Educação: ['escola', 'faculdade', 'curso', 'mensalidade', 'colegio', 'udemy', 'alura'],
  Lazer: ['cinema', 'teatro', 'show', 'netflix', 'spotify', 'amazon', 'steam', 'jogo', 'entretenimento', 'disney'],
  'Pix enviado': ['pix enviado', 'ted enviado', 'doc enviado'],
  'Pix recebido': ['pix recebido', 'ted recebido', 'doc recebido'],
  Renda: ['salario', 'folha pagamento'],
  Transferência: ['transferencia', 'transf'],
  Investimentos: ['investimento', 'aplicacao', 'resgate', 'fundo', 'cdb', 'tesouro'],
};

function normalizar(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

@Injectable()
export class TransacaoService {
  private readonly logger = new Logger(TransacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pluggy: PluggyAdapter,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
  ) {}

  /** Lista transações do usuário com filtros e paginação. */
  async listar(usuarioId: number, filtro: FiltroTransacaoDto) {
    const page = filtro.page ?? 1;
    const limit = filtro.limit ?? 20;

    const where: Record<string, unknown> = {
      conta: { consentimento: { usuarioId, status: 'ATIVO' } },
    };
    if (filtro.de || filtro.ate) {
      where['data'] = {
        ...(filtro.de ? { gte: new Date(filtro.de) } : {}),
        ...(filtro.ate ? { lte: new Date(filtro.ate) } : {}),
      };
    }
    if (filtro.categoriaId) where['categoriaId'] = filtro.categoriaId;
    if (filtro.tipo) where['tipo'] = filtro.tipo;
    if (filtro.contaId) where['contaId'] = filtro.contaId;

    const [dados, total] = await Promise.all([
      this.prisma.transacao.findMany({
        where: where as never,
        include: {
          categoria: { select: { nome: true, icone: true } },
          conta: {
            select: {
              numeroMascarado: true,
              consentimento: {
                include: { instituicao: { select: { nome: true } } },
              },
            },
          },
        },
        orderBy: { data: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transacao.count({ where: where as never }),
    ]);

    return {
      dados,
      total,
      pagina: page,
      porPagina: limit,
      totalPaginas: Math.ceil(total / limit),
    };
  }

  /**
   * Sincroniza transações dos últimos 90 dias via Pluggy.
   * Aplica auto-categorização para transações novas.
   */
  async sincronizar(usuarioId: number, ip?: string): Promise<{ sincronizadas: number }> {
    const [categorias, regrasUsuario] = await Promise.all([
      this.prisma.categoria.findMany({
        where: { padraoSistema: true },
        select: { id: true, nome: true },
      }),
      this.prisma.regraCategorizacao.findMany({
        where: { usuarioId },
        select: { palavra: true, categoriaId: true },
      }),
    ]);

    const consentimentos = await this.prisma.consentimento.findMany({
      where: { usuarioId, status: 'ATIVO' },
      include: { contas: true },
    });

    const noventa = new Date(Date.now() - 90 * 86_400_000);
    const hoje = new Date();
    let sincronizadas = 0;

    for (const c of consentimentos) {
      for (const conta of c.contas) {
        try {
          const txs = await this.pluggy.buscarTransacoes(
            conta.idExternoPluggy,
            noventa,
            hoje,
          );

          for (const tx of txs) {
            const categoriaId = this.categorizarAuto(tx.description ?? '', categorias, regrasUsuario);
            await this.prisma.transacao.upsert({
              where: { idExternoPluggy: tx.id },
              create: {
                contaId: conta.id,
                idExternoPluggy: tx.id,
                descricao: tx.description ?? 'Sem descrição',
                valor: tx.amount,
                tipo: tx.type,
                data: new Date(tx.date),
                metodoPagamento: (tx as Record<string, unknown>)['paymentData']
                  ? String((tx as Record<string, { paymentMethod?: string }>)['paymentData']?.paymentMethod ?? '')
                  : null,
                categoriaId,
              },
              update: {},
            });
            sincronizadas++;
          }

          await this.prisma.contaBancaria.update({
            where: { id: conta.id },
            data: { ultimaSincronizacao: new Date() },
          });
        } catch (err) {
          this.logger.warn(`Erro ao sincronizar conta ${conta.id}: ${String(err)}`);
        }
      }
    }

    await this.audit.registrar(usuarioId, 'SINCRONIZACAO_REALIZADA', 'transacao', ip);
    this.logger.log(`Sincronizadas ${sincronizadas} transações para usuário ${usuarioId}`);
    return { sincronizadas };
  }

  /** Resumo de gastos por categoria para a Alexa Skill (ConsultarGastosIntent). */
  async resumoCategorias(
    usuarioId: number,
    dataInicio?: string,
  ): Promise<{ categorias: Array<{ nome: string; total: number }> }> {
    const inicio = dataInicio
      ? new Date(dataInicio)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const transacoes = await this.prisma.transacao.findMany({
      where: {
        conta: { consentimento: { usuarioId, status: 'ATIVO' } },
        tipo: 'DEBIT',
        data: { gte: inicio },
      },
      include: { categoria: { select: { nome: true } } },
    });

    const mapa: Record<string, number> = {};
    for (const tx of transacoes) {
      const nome = tx.categoria?.nome ?? 'Outros';
      mapa[nome] = (mapa[nome] ?? 0) + Number(tx.valor);
    }

    const categorias = Object.entries(mapa)
      .map(([nome, total]) => ({ nome, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);

    return { categorias };
  }

  /** Override manual de categoria (RF05): marca categoriaAjustadaManualmente = true. */
  async ajustarCategoria(transacaoId: number, categoriaId: number, usuarioId: number) {
    const tx = await this.prisma.transacao.findFirst({
      where: {
        id: transacaoId,
        conta: { consentimento: { usuarioId, status: 'ATIVO' } },
      },
    });
    if (!tx) {
      const { NotFoundException } = await import('@nestjs/common');
      throw new NotFoundException('Transação não encontrada');
    }
    return this.prisma.transacao.update({
      where: { id: transacaoId },
      data: { categoriaId, categoriaAjustadaManualmente: true },
    });
  }

  private categorizarAuto(
    descricao: string,
    categorias: Array<{ id: number; nome: string }>,
    regrasUsuario: Array<{ palavra: string; categoriaId: number }> = [],
  ): number | null {
    const descNorm = normalizar(descricao);

    // Regras do usuário têm prioridade sobre as palavras-chave do sistema
    for (const regra of regrasUsuario) {
      if (descNorm.includes(normalizar(regra.palavra))) {
        return regra.categoriaId;
      }
    }

    for (const [nome, keywords] of Object.entries(KEYWORDS)) {
      if (keywords.some((kw) => descNorm.includes(kw))) {
        const cat = categorias.find((c) => c.nome === nome);
        if (cat) return cat.id;
      }
    }

    // Fallback: Outros
    return categorias.find((c) => c.nome === 'Outros')?.id ?? null;
  }
}
