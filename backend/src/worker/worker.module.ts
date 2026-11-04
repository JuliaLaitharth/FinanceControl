import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificacaoModule } from '../notificacao/notificacao.module.js';
import { TransacaoModule } from '../transacao/transacao.module.js';
import { PLUGGY_SYNC_QUEUE, SyncWorkerProcessor } from './worker.processor.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: PLUGGY_SYNC_QUEUE }),
    TransacaoModule,
    NotificacaoModule,
  ],
  providers: [SyncWorkerProcessor],
  exports: [BullModule],
})
export class WorkerModule {}
