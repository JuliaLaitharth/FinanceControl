import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { RegraCategorizacaoController } from './regra-categorizacao.controller.js';
import { RegraCategorizacaoService } from './regra-categorizacao.service.js';

@Module({
  imports: [AuditModule],
  controllers: [RegraCategorizacaoController],
  providers: [RegraCategorizacaoService],
  exports: [RegraCategorizacaoService],
})
export class RegraCategorizacaoModule {}
