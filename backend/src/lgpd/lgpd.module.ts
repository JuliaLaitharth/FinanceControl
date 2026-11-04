import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { PluggyModule } from '../pluggy/pluggy.module.js';
import { LgpdService } from './lgpd.service.js';

@Module({
  imports: [PluggyModule, AuditModule],
  providers: [LgpdService],
  exports: [LgpdService],
})
export class LgpdModule {}
