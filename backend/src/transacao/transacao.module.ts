import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { PluggyModule } from '../pluggy/pluggy.module.js';
import { TransacaoController } from './transacao.controller.js';
import { TransacaoService } from './transacao.service.js';

@Module({
  imports: [PluggyModule, AuditModule],
  controllers: [TransacaoController],
  providers: [TransacaoService],
  exports: [TransacaoService],
})
export class TransacaoModule {}
