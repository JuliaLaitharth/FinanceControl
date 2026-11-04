import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../encryption/encryption.service';
import { PluggyAdapter } from '../pluggy/pluggy.adapter';
import { createPrismaMock } from '../test-utils/prisma.mock';
import { LgpdService } from './lgpd.service';

const consentimentoFake = (overrides = {}) => ({
  id: 1,
  usuarioId: 42,
  status: 'ATIVO',
  itemIdPluggy: 'iv:cipher:tag',
  ...overrides,
});

describe('LgpdService', () => {
  let service: LgpdService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let pluggy: jest.Mocked<PluggyAdapter>;
  let encryption: jest.Mocked<EncryptionService>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(() => {
    prisma = createPrismaMock();
    pluggy = { revogarItem: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<PluggyAdapter>;
    encryption = { decrypt: jest.fn().mockReturnValue('real-item-id') } as unknown as jest.Mocked<EncryptionService>;
    audit = { registrar: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    service = new LgpdService(prisma as never, pluggy, encryption, audit);
  });

  describe('excluirConta()', () => {
    it('revoga items Pluggy, audita e exclui o usuário', async () => {
      prisma.consentimento.findMany.mockResolvedValue([consentimentoFake()] as never);
      prisma.usuario.delete.mockResolvedValue({ id: 42 } as never);

      await service.excluirConta(42, '127.0.0.1');

      expect(encryption.decrypt).toHaveBeenCalledWith('iv:cipher:tag');
      expect(pluggy.revogarItem).toHaveBeenCalledWith('real-item-id');
      expect(audit.registrar).toHaveBeenCalledWith(42, 'CONTA_EXCLUIDA_LGPD', 'usuario', '127.0.0.1');
      expect(prisma.usuario.delete).toHaveBeenCalledWith({ where: { id: 42 } });
    });

    it('prossegue com a exclusão mesmo se a revogação Pluggy falhar', async () => {
      prisma.consentimento.findMany.mockResolvedValue([consentimentoFake()] as never);
      encryption.decrypt.mockImplementation(() => { throw new Error('decrypt error'); });
      prisma.usuario.delete.mockResolvedValue({ id: 42 } as never);

      await expect(service.excluirConta(42)).resolves.toBeUndefined();

      expect(prisma.usuario.delete).toHaveBeenCalledWith({ where: { id: 42 } });
    });

    it('funciona sem consentimentos ativos', async () => {
      prisma.consentimento.findMany.mockResolvedValue([] as never);
      prisma.usuario.delete.mockResolvedValue({ id: 42 } as never);

      await service.excluirConta(42);

      expect(pluggy.revogarItem).not.toHaveBeenCalled();
      expect(prisma.usuario.delete).toHaveBeenCalledWith({ where: { id: 42 } });
    });
  });
});
