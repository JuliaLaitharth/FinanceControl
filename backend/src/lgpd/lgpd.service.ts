import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service.js';
import { EncryptionService } from '../encryption/encryption.service.js';
import { PluggyAdapter } from '../pluggy/pluggy.adapter.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LgpdService {
  private readonly logger = new Logger(LgpdService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pluggy: PluggyAdapter,
    private readonly encryption: EncryptionService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Exclui permanentemente todos os dados do usuário (RF10 — LGPD direito ao esquecimento).
   * Revoga consentimentos Pluggy na origem, registra auditoria e apaga o registro.
   * O cascade do Prisma remove todos os dados relacionados.
   */
  async excluirConta(usuarioId: number, ip?: string): Promise<void> {
    // 1. Revogar itens Pluggy (melhor esforço — a exclusão local prossegue mesmo se falhar)
    const consentimentos = await this.prisma.consentimento.findMany({
      where: { usuarioId, status: 'ATIVO' },
    });
    for (const c of consentimentos) {
      try {
        const itemIdDecriptado = this.encryption.decrypt(c.itemIdPluggy);
        await this.pluggy.revogarItem(itemIdDecriptado);
      } catch (err) {
        this.logger.warn(`Falha ao revogar item Pluggy na exclusão LGPD: ${String(err)}`);
      }
    }

    // 2. Registrar auditoria antes de excluir (o log será removido junto com o usuário pelo cascade)
    await this.audit.registrar(usuarioId, 'CONTA_EXCLUIDA_LGPD', 'usuario', ip);

    // 3. Excluir usuário — cascade remove: sessões, tokens, vínculos Alexa, consentimentos,
    //    contas, transações, categorias, regras de alerta, notificações, logs de auditoria
    await this.prisma.usuario.delete({ where: { id: usuarioId } });
    this.logger.log(`Conta do usuário ${usuarioId} excluída por solicitação LGPD`);
  }
}
