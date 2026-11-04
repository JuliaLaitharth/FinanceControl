import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';
import { FinanceApiService } from '../services/finance-api.service';

export const LaunchRequestHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    return input.requestEnvelope.request.type === 'LaunchRequest';
  },

  async handle(input: HandlerInput): Promise<Response> {
    const { accessToken, userId } = input.requestEnvelope.context.System.user;

    if (!accessToken) {
      return input.responseBuilder
        .speak(
          'Para usar a FinVoice, primeiro vincule sua conta no aplicativo FinanceControl. ' +
            'Acesse as configurações da skill no seu aplicativo Alexa.',
        )
        .withLinkAccountCard()
        .getResponse();
    }

    // Registra o Alexa User ID no backend para habilitar Proactive Events (melhor esforço)
    try {
      const api = new FinanceApiService(accessToken);
      await api.registrarAlexaId(userId);
    } catch { /* não crítico */ }

    return input.responseBuilder
      .speak(
        'Olá! Bem-vindo à FinVoice. ' +
          'Você pode me perguntar: como estão minhas finanças, qual é meu saldo, ' +
          'ou quanto gastei este mês.',
      )
      .reprompt('Como posso ajudar com suas finanças?')
      .getResponse();
  },
};
