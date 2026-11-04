import { Module } from '@nestjs/common';
import { PluggyAdapter } from './pluggy.adapter';

@Module({
  providers: [PluggyAdapter],
  exports: [PluggyAdapter],
})
export class PluggyModule {}
