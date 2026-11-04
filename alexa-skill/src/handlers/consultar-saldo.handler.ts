import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { IntentRequest, Response } from 'ask-sdk-model';
import { FinanceApiService } from '../services/finance-api.service';

export const ConsultarSaldoHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const request = input.requestEnvelope.request;
    return (
      request.type === 'IntentRequest' &&
      (request as IntentRequest).intent.name === 'ConsultarSaldoIntent'
    );
  },

  async handle(input: HandlerInput): Promise<Response> {
    const { accessToken } = input.requestEnvelope.context.System.user;

    if (!accessToken) {
      return input.responseBuilder
        .speak('Você precisa vincular sua conta no aplicativo FinanceControl para continuar.')
        .withLinkAccountCard()
        .getResponse();
    }

    try {
      const api = new FinanceApiService(accessToken);
      const saldo = await api.getSaldoConsolidado();

      const valorFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(saldo.total);

      return input.responseBuilder
        .speak(`Seu saldo consolidado é de ${valorFormatado}.`)
        .getResponse();
    } catch {
      return input.responseBuilder
        .speak('Não consegui acessar seus dados financeiros no momento. Tente novamente em instantes.')
        .getResponse();
    }
  },
};
