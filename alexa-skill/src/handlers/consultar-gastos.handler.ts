import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { IntentRequest, Response } from 'ask-sdk-model';
import { FinanceApiService } from '../services/finance-api.service';

export const ConsultarGastosHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const request = input.requestEnvelope.request;
    return (
      request.type === 'IntentRequest' &&
      ['ConsultarGastosIntent', 'ConsultarFinancasIntent'].includes(
        (request as IntentRequest).intent.name,
      )
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
      const [saldo, resumo] = await Promise.all([
        api.getSaldoConsolidado(),
        api.getResumoCategorias(),
      ]);

      const saldoFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(saldo.total);

      const topCategorias = resumo.categorias
        .slice(0, 3)
        .map((c: { nome: string; total: number }) => {
          const valor = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(c.total);
          return `${c.nome}: ${valor}`;
        })
        .join(', ');

      const fala =
        `Seu saldo consolidado é de ${saldoFormatado}. ` +
        (topCategorias
          ? `Este mês seus principais gastos foram: ${topCategorias}.`
          : 'Sem gastos registrados este mês.');

      return input.responseBuilder.speak(fala).getResponse();
    } catch {
      return input.responseBuilder
        .speak('Não consegui acessar seus dados financeiros no momento. Tente novamente em instantes.')
        .getResponse();
    }
  },
};
