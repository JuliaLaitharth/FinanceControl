import { Module } from '@nestjs/common';
import { NotificacaoController } from './notificacao.controller.js';
import { NotificacaoService } from './notificacao.service.js';

@Module({
  controllers: [NotificacaoController],
  providers: [NotificacaoService],
  exports: [NotificacaoService],
})
export class NotificacaoModule {}
