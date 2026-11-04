import { Global, Module } from '@nestjs/common';
import { AlexaService } from './alexa.service.js';

@Global()
@Module({
  providers: [AlexaService],
  exports: [AlexaService],
})
export class AlexaModule {}
