import { HandlerInput, RequestHandler, ErrorHandler as ASKErrorHandler } from 'ask-sdk-core';
import { Response } from 'ask-sdk-model';

export const HelpHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const request = input.requestEnvelope.request;
    return (
      request.type === 'IntentRequest' &&
      (request as { intent: { name: string } } & typeof request).intent.name === 'AMAZON.HelpIntent'
    );
  },
  handle(input: HandlerInput): Response {
    return input.responseBuilder
      .speak(
        'Você pode me perguntar: qual é meu saldo, como estão minhas finanças, ' +
          'ou quanto gastei este mês.',
      )
      .reprompt('Como posso ajudar?')
      .getResponse();
  },
};

export const CancelAndStopHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    const request = input.requestEnvelope.request;
    return (
      request.type === 'IntentRequest' &&
      ['AMAZON.CancelIntent', 'AMAZON.StopIntent'].includes(
        (request as { intent: { name: string } } & typeof request).intent.name,
      )
    );
  },
  handle(input: HandlerInput): Response {
    return input.responseBuilder.speak('Até logo!').getResponse();
  },
};

export const SessionEndedHandler: RequestHandler = {
  canHandle(input: HandlerInput): boolean {
    return input.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(input: HandlerInput): Response {
    return input.responseBuilder.getResponse();
  },
};

export const ErrorHandler: ASKErrorHandler = {
  canHandle(): boolean {
    return true;
  },
  handle(input: HandlerInput, error: Error): Response {
    console.error('[FinVoice] Erro:', error.message);
    return input.responseBuilder
      .speak('Ocorreu um erro inesperado. Tente novamente.')
      .getResponse();
  },
};
