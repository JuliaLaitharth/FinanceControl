import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { RegraAlertaController } from './regra-alerta.controller.js';
import { RegraAlertaService } from './regra-alerta.service.js';

@Module({
  imports: [AuditModule],
  controllers: [RegraAlertaController],
  providers: [RegraAlertaService],
  exports: [RegraAlertaService],
})
export class RegraAlertaModule {}
