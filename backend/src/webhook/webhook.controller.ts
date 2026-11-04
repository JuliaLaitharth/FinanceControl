import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

interface PluggyWebhookPayload {
  event: string;
  itemId: string;
  [key: string]: unknown;
}

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private readonly secret: string;

  constructor(config: ConfigService) {
    this.secret = config.getOrThrow<string>('PLUGGY_WEBHOOK_SECRET');
  }

  @Post('pluggy')
  @HttpCode(200)
  async handlePluggy(
    @Body() payload: PluggyWebhookPayload,
    @Headers('x-pluggy-signature') signature: string,
    @Body('_raw') raw: string,
  ) {
    this.validarAssinatura(raw ?? JSON.stringify(payload), signature);

    this.logger.log(`Webhook Pluggy recebido: evento=${payload.event} itemId=${payload.itemId}`);

    // TODO (Etapa 5): enfileirar job de sincronização via BullMQ
    // await this.syncQueue.add('sync-item', { itemId: payload.itemId, event: payload.event });

    return { received: true };
  }

  private validarAssinatura(body: string, signature: string) {
    if (!signature) throw new UnauthorizedException('Assinatura do webhook ausente');
    const esperado = createHmac('sha256', this.secret).update(body).digest('hex');
    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(esperado);
    if (
      sigBuffer.length !== expBuffer.length ||
      !timingSafeEqual(sigBuffer, expBuffer)
    ) {
      throw new UnauthorizedException('Assinatura do webhook inválida');
    }
  }
}
