import { SkillBuilders } from 'ask-sdk-core';
import { LaunchRequestHandler } from './handlers/launch.handler';
import { ConsultarSaldoHandler } from './handlers/consultar-saldo.handler';
import { ConsultarGastosHandler } from './handlers/consultar-gastos.handler';
import { HelpHandler, CancelAndStopHandler, SessionEndedHandler, ErrorHandler } from './handlers/common.handlers';

export const handler = SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    ConsultarSaldoHandler,
    ConsultarGastosHandler,
    HelpHandler,
    CancelAndStopHandler,
    SessionEndedHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .withApiClient(new (require('ask-sdk-core').DefaultApiClient)())
  .lambda();
