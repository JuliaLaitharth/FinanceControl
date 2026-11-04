import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PluggyModule } from '../pluggy/pluggy.module';
import { ConsentimentoController } from './consentimento.controller';
import { ConsentimentoService } from './consentimento.service';

@Module({
  imports: [PluggyModule, AuditModule],
  controllers: [ConsentimentoController],
  providers: [ConsentimentoService],
  exports: [ConsentimentoService],
})
export class ConsentimentoModule {}
