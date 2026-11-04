import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ContaController } from './conta.controller';
import { ContaService } from './conta.service';

@Module({
  imports: [AuditModule],
  controllers: [ContaController],
  providers: [ContaService],
  exports: [ContaService],
})
export class ContaModule {}
