import { HandlerInput, RequestHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';

export const LaunchRequestHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    return input.requestEnvelope.request.type === 'LaunchRequest';
  },

  handle(input: HandlerInput): Response {
    const { accessToken } = input.requestEnvelope.context.System.user;

    if (!accessToken) {
      return input.responseBuilder
        .speak(
          'Para usar a FinVoice, primeiro vincule sua conta no aplicativo FinanceControl. ' +
            'Acesse as configurações da skill no seu aplicativo Alexa.',
        )
        .withLinkAccountCard()
        .getResponse();
    }

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
