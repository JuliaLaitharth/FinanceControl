import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PLUGGY_SYNC_QUEUE } from '../worker/worker.processor.js';
import { WebhookController } from './webhook.controller.js';

@Module({
  imports: [BullModule.registerQueue({ name: PLUGGY_SYNC_QUEUE })],
  controllers: [WebhookController],
})
export class WebhookModule {}
