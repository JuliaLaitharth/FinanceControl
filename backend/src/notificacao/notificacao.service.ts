import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class NotificacaoService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lista notificações do usuário (via regras do usuário). */
  async listar(usuarioId: number, apenasNaoLidas = false) {
    return this.prisma.notificacao.findMany({
      where: {
        regra: { usuarioId },
        ...(apenasNaoLidas ? { lida: false } : {}),
      },
      include: {
        regra: { select: { tipoEvento: true, canal: true } },
        transacao: { select: { descricao: true, valor: true, tipo: true, data: true } },
      },
      orderBy: { dataEnvio: 'desc' },
      take: 50,
    });
  }

  /** Conta notificações não lidas do usuário. */
  async contarNaoLidas(usuarioId: number): Promise<number> {
    return this.prisma.notificacao.count({
      where: { regra: { usuarioId }, lida: false },
    });
  }

  /** Marca uma notificação como lida (verifica propriedade). */
  async marcarComoLida(id: number, usuarioId: number) {
    const notif = await this.prisma.notificacao.findFirst({
      where: { id, regra: { usuarioId } },
    });
    if (!notif) return null;
    return this.prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });
  }

  /** Marca todas as notificações do usuário como lidas. */
  async marcarTodasComoLidas(usuarioId: number): Promise<{ atualizadas: number }> {
    const { count } = await this.prisma.notificacao.updateMany({
      where: { regra: { usuarioId }, lida: false },
      data: { lida: true },
    });
    return { atualizadas: count };
  }

  /**
   * Cria notificação de forma idempotente.
   * A constraint unique [regraId, transacaoId] garante que a mesma regra
   * não dispara duas vezes para a mesma transação.
   * Retorna null se já existir (duplicata silenciosa).
   */
  async criarIdempotente(params: {
    regraId: number;
    transacaoId: number | null;
    mensagem: string;
    canal: string;
  }) {
    try {
      return await this.prisma.notificacao.create({
        data: {
          regraId: params.regraId,
          transacaoId: params.transacaoId,
          mensagem: params.mensagem,
          canal: params.canal,
          statusEnvio: 'PENDENTE',
        },
      });
    } catch {
      // Unique constraint violation → notificação já existe, ignora
      return null;
    }
  }

  /** Atualiza statusEnvio após tentativa de push FCM. */
  async atualizarStatus(id: number, status: 'ENVIADO' | 'FALHA', dataEnvio?: Date) {
    return this.prisma.notificacao.update({
      where: { id },
      data: { statusEnvio: status, dataEnvio: dataEnvio ?? new Date() },
    });
  }
}
