import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PluggyClient } from 'pluggy-sdk';

@Injectable()
export class PluggyAdapter {
  private readonly logger = new Logger(PluggyAdapter.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private _client: PluggyClient | null = null;

  constructor(config: ConfigService) {
    this.clientId = config.getOrThrow<string>('PLUGGY_CLIENT_ID');
    this.clientSecret = config.getOrThrow<string>('PLUGGY_CLIENT_SECRET');
  }

  private get client(): PluggyClient {
    if (!this._client) {
      this._client = new PluggyClient({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      });
    }
    return this._client;
  }

  /** Gera um connect token para abrir o widget no app (válido por 30 min). */
  async criarConnectToken(itemId?: string): Promise<string> {
    try {
      const { accessToken } = await this.client.createConnectToken(itemId ?? undefined);
      return accessToken;
    } catch (err) {
      this.logger.error('Erro ao criar connect token Pluggy', err);
      throw new ServiceUnavailableException('Serviço de conexão bancária indisponível no momento.');
    }
  }

  /** Busca contas de um item Pluggy. */
  async buscarContas(itemId: string) {
    try {
      const { results } = await this.client.fetchAccounts(itemId);
      return results;
    } catch (err) {
      this.logger.error(`Erro ao buscar contas do item ${itemId}`, err);
      throw new ServiceUnavailableException('Não foi possível sincronizar as contas bancárias.');
    }
  }

  /** Busca transações de uma conta Pluggy num intervalo de datas. */
  async buscarTransacoes(accountId: string, de: Date, ate: Date) {
    try {
      const { results } = await this.client.fetchTransactions(accountId, {
        from: de.toISOString().split('T')[0],
        to: ate.toISOString().split('T')[0],
        pageSize: 500,
      });
      return results;
    } catch (err) {
      this.logger.error(`Erro ao buscar transações da conta ${accountId}`, err);
      throw new ServiceUnavailableException('Não foi possível buscar as transações.');
    }
  }

  /** Busca detalhes de um item. */
  async buscarItem(itemId: string) {
    try {
      return await this.client.fetchItem(itemId);
    } catch (err) {
      this.logger.error(`Erro ao buscar item ${itemId}`, err);
      throw new ServiceUnavailableException('Não foi possível verificar o status da conexão.');
    }
  }

  /** Revoga o item no Pluggy (exclui o consentimento na origem). */
  async revogarItem(itemId: string): Promise<void> {
    try {
      await this.client.deleteItem(itemId);
    } catch (err) {
      // Log mas não lança — a revogação local deve prosseguir mesmo se a API Pluggy falhar
      this.logger.warn(`Falha ao revogar item ${itemId} no Pluggy (continuando revogação local)`, err);
    }
  }
}
