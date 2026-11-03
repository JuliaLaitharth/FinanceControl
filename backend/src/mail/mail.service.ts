import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async enviarRecuperacaoSenha(email: string, token: string) {
    this.logger.log(`[DEV] Recuperação de senha para ${email} | token: ${token}`);
  }
}