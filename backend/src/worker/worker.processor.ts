import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { FcmService } from '../fcm/fcm.service.js';
import { NotificacaoService } from '../notificacao/notificacao.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { TransacaoService } from '../transacao/transacao.service.js';

export interface PluggySyncJobData {
  usuarioId: number;
  event: string;
}

export const PLUGGY_SYNC_QUEUE = 'pluggy-sync';

@Processor(PLUGGY_SYNC_QUEUE, {
  // Reprocessamento automático: 3 tentativas com backoff exponencial
  concurrency: 2,
})
export class SyncWorkerProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncWorkerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transacaoService: TransacaoService,
    private readonly notificacaoService: NotificacaoService,
    private readonly fcmService: FcmService,
  ) {
    super();
  }

  async process(job: Job<PluggySyncJobData>): Promise<void> {
    const { usuarioId, event } = job.data;
    this.logger.log(`Processando job ${job.id} — evento: ${event}, usuário: ${usuarioId}`);

    // 1. Sincroniza transações via Pluggy
    const { sincronizadas } = await this.transacaoService.sincronizar(usuarioId);
    this.logger.log(`Sincronizadas ${sincronizadas} transações`);

    if (sincronizadas === 0) return;

    // 2. Busca transações sincronizadas recentemente (últimos 2 min)
    const corte = new Date(Date.now() - 2 * 60 * 1000);
    const txsRecentes = await this.prisma.transacao.findMany({
      where: {
        conta: { consentimento: { usuarioId, status: 'ATIVO' } },
        data: { gte: corte },
      },
      include: { conta: true },
    });

    // 3. Busca contas para verificar saldo mínimo
    const contas = await this.prisma.contaBancaria.findMany({
      where: { consentimento: { usuarioId, status: 'ATIVO' } },
    });

    // 4. Busca regras ativas do usuário
    const regras = await this.prisma.regraAlerta.findMany({
      where: { usuarioId, ativa: true },
    });

    // 5. Busca FCM token do usuário
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { fcmToken: true, nome: true },
    });

    for (const regra of regras) {
      if (regra.tipoEvento === 'SALDO_MINIMO') {
        await this.avaliarSaldoMinimo(regra, contas, usuario?.fcmToken ?? null);
        continue;
      }

      for (const tx of txsRecentes) {
        if (await this.regraCorresponde(regra, tx)) {
          const notif = await this.notificacaoService.criarIdempotente({
            regraId: regra.id,
            transacaoId: tx.id,
            mensagem: this.gerarMensagem(regra, tx),
            canal: regra.canal,
          });

          if (notif && usuario?.fcmToken && regra.canal !== 'EMAIL') {
            const enviado = await this.fcmService.enviar(
              usuario.fcmToken,
              'Alerta Financeiro',
              notif.mensagem,
            );
            await this.notificacaoService.atualizarStatus(
              notif.id,
              enviado ? 'ENVIADO' : 'FALHA',
              new Date(),
            );
          }
        }
      }
    }
  }

  private async regraCorresponde(
    regra: { tipoEvento: string; valorLimite: unknown; categoriaId: number | null },
    tx: { tipo: string; valor: unknown; categoriaId: number | null },
  ): Promise<boolean> {
    const limite = Number(regra.valorLimite ?? 0);
    const valor = Number(tx.valor ?? 0);

    switch (regra.tipoEvento) {
      case 'TRANSACAO_GRANDE':
        return tx.tipo === 'DEBIT' && valor > limite;
      case 'DESPESA_CATEGORIA':
        return tx.tipo === 'DEBIT' && tx.categoriaId === regra.categoriaId && valor > limite;
      default:
        return false;
    }
  }

  private async avaliarSaldoMinimo(
    regra: { id: number; valorLimite: unknown; canal: string },
    contas: Array<{ id: number; saldoAtual: unknown; tipo: string }>,
    fcmToken: string | null,
  ) {
    const limite = Number(regra.valorLimite ?? 0);
    for (const conta of contas) {
      if (Number(conta.saldoAtual) < limite) {
        // Idempotência para saldo mínimo: verifica se já notificou nas últimas 24h
        const jaNot = await this.prisma.notificacao.findFirst({
          where: {
            regraId: regra.id,
            transacaoId: null,
            dataEnvio: { gte: new Date(Date.now() - 24 * 3_600_000) },
          },
        });
        if (jaNot) continue;

        const mensagem = `Saldo abaixo do limite: R$ ${Number(conta.saldoAtual).toFixed(2)} (mínimo: R$ ${limite.toFixed(2)})`;
        const notif = await this.notificacaoService.criarIdempotente({
          regraId: regra.id,
          transacaoId: null,
          mensagem,
          canal: regra.canal,
        });

        if (notif && fcmToken && regra.canal !== 'EMAIL') {
          const enviado = await this.fcmService.enviar(fcmToken, 'Saldo baixo', mensagem);
          await this.notificacaoService.atualizarStatus(notif.id, enviado ? 'ENVIADO' : 'FALHA', new Date());
        }
      }
    }
  }

  private gerarMensagem(
    regra: { tipoEvento: string; valorLimite: unknown },
    tx: { descricao: string; valor: unknown },
  ): string {
    const valor = Number(tx.valor).toFixed(2);
    switch (regra.tipoEvento) {
      case 'TRANSACAO_GRANDE':
        return `Transação de R$ ${valor}: "${tx.descricao}" acima do limite de R$ ${Number(regra.valorLimite).toFixed(2)}`;
      case 'DESPESA_CATEGORIA':
        return `Gasto de R$ ${valor} em "${tx.descricao}" acima do limite da categoria`;
      default:
        return `Alerta: R$ ${valor} — "${tx.descricao}"`;
    }
  }
}
