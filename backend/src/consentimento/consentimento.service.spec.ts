import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../encryption/encryption.service';
import { PluggyAdapter } from '../pluggy/pluggy.adapter';
import { createPrismaMock } from '../test-utils/prisma.mock';
import { ConsentimentoService } from './consentimento.service';

// ─── Fakes ───────────────────────────────────────────────────────────────────

const itemPluggyFake = {
  id: 'item-uuid',
  connector: { id: 123, name: 'Banco Sandbox', imageUrl: 'https://img.sandbox/logo.png' },
};

const contasPluggyFake = [
  { id: 'account-1', type: 'CHECKING', number: '****1234', balance: 1000, currencyCode: 'BRL' },
  { id: 'account-2', type: 'SAVINGS', number: '****5678', balance: 2500, currencyCode: 'BRL' },
];

const consentimentoFake = (overrides = {}) => ({
  id: 1,
  usuarioId: 42,
  instituicaoId: 1,
  itemIdPluggy: 'criptografado',
  status: 'ATIVO',
  dataConsentimento: new Date(),
  dataExpiracao: new Date(Date.now() + 365 * 86_400_000),
  dataRevogacao: null,
  instituicao: { nome: 'Banco Sandbox', logoUrl: null },
  contas: [],
  ...overrides,
});

// ─── Suíte ───────────────────────────────────────────────────────────────────

describe('ConsentimentoService', () => {
  let service: ConsentimentoService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let pluggy: jest.Mocked<PluggyAdapter>;
  let encryption: jest.Mocked<EncryptionService>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(() => {
    prisma = createPrismaMock();
    pluggy = {
      criarConnectToken: jest.fn(),
      buscarContas: jest.fn(),
      buscarTransacoes: jest.fn(),
      buscarItem: jest.fn(),
      revogarItem: jest.fn(),
    } as unknown as jest.Mocked<PluggyAdapter>;

    encryption = {
      encrypt: jest.fn().mockReturnValue('criptografado'),
      decrypt: jest.fn().mockReturnValue('item-uuid-real'),
    } as unknown as jest.Mocked<EncryptionService>;

    audit = {
      registrar: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>;

    service = new ConsentimentoService(prisma as never, pluggy, encryption, audit);
  });

  // ─── gerarConnectToken ───────────────────────────────────────────────────

  describe('gerarConnectToken()', () => {
    it('retorna connectToken e registra auditoria', async () => {
      pluggy.criarConnectToken.mockResolvedValue('ct-abc123');

      const result = await service.gerarConnectToken(42);

      expect(result.connectToken).toBe('ct-abc123');
      expect(audit.registrar).toHaveBeenCalledWith(42, 'CONNECT_TOKEN_GERADO', 'consentimento');
    });
  });

  // ─── criar ───────────────────────────────────────────────────────────────

  describe('criar()', () => {
    it('cria consentimento, persiste contas e registra auditoria', async () => {
      // Sem duplicidade; retorna o consentimento na busca final (buscarPorId)
      prisma.consentimento.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValue(consentimentoFake() as never);
      pluggy.buscarItem.mockResolvedValue(itemPluggyFake as never);
      pluggy.buscarContas.mockResolvedValue(contasPluggyFake as never);
      prisma.instituicao.upsert.mockResolvedValue({
        id: 1,
        nome: 'Banco Sandbox',
        codigoPluggy: '123',
        logoUrl: null,
      });
      prisma.consentimento.create.mockResolvedValue(consentimentoFake() as never);
      prisma.contaBancaria.createMany.mockResolvedValue({ count: 2 });

      const result = await service.criar({ itemId: 'item-uuid' }, 42, '127.0.0.1');

      expect(encryption.encrypt).toHaveBeenCalledWith('item-uuid');
      expect(pluggy.buscarItem).toHaveBeenCalledWith('item-uuid');
      expect(pluggy.buscarContas).toHaveBeenCalledWith('item-uuid');
      expect(prisma.contaBancaria.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ idExternoPluggy: 'account-1' }),
          ]),
        }),
      );
      expect(audit.registrar).toHaveBeenCalledWith(
        42,
        'CONSENTIMENTO_CRIADO',
        'consentimento',
        '127.0.0.1',
      );
      expect(result).toBeTruthy();
    });

    it('lança ConflictException "Conta já conectada" para itemId duplicado', async () => {
      // Primeiro findFirst já retorna um registro existente → duplicidade
      prisma.consentimento.findFirst.mockResolvedValue(consentimentoFake() as never);

      await expect(service.criar({ itemId: 'item-uuid' }, 42)).rejects.toThrow(
        new ConflictException('Conta já conectada'),
      );

      expect(pluggy.buscarItem).not.toHaveBeenCalled();
    });
  });

  // ─── listar ──────────────────────────────────────────────────────────────

  describe('listar()', () => {
    it('retorna lista de consentimentos ativos do usuário', async () => {
      const lista = [consentimentoFake(), consentimentoFake({ id: 2 })];
      prisma.consentimento.findMany.mockResolvedValue(lista as never);

      const result = await service.listar(42);

      expect(result).toHaveLength(2);
      expect(prisma.consentimento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { usuarioId: 42, status: 'ATIVO' } }),
      );
    });
  });

  // ─── revogar ─────────────────────────────────────────────────────────────

  describe('revogar()', () => {
    it('descriptografa, revoga no Pluggy, apaga localmente e registra auditoria', async () => {
      prisma.consentimento.findFirst.mockResolvedValue(consentimentoFake() as never);
      pluggy.revogarItem.mockResolvedValue(undefined);
      prisma.consentimento.delete.mockResolvedValue(consentimentoFake() as never);

      await service.revogar(1, 42, '127.0.0.1');

      expect(encryption.decrypt).toHaveBeenCalledWith('criptografado');
      expect(pluggy.revogarItem).toHaveBeenCalledWith('item-uuid-real');
      expect(prisma.consentimento.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(audit.registrar).toHaveBeenCalledWith(
        42,
        'CONSENTIMENTO_REVOGADO',
        'consentimento',
        '127.0.0.1',
      );
    });

    it('lança NotFoundException quando consentimento não pertence ao usuário', async () => {
      prisma.consentimento.findFirst.mockResolvedValue(null); // outro usuário ou inexistente

      await expect(service.revogar(99, 42)).rejects.toThrow(NotFoundException);
      expect(pluggy.revogarItem).not.toHaveBeenCalled();
    });

    it('apaga o registro local mesmo se a revogação no Pluggy falhar', async () => {
      prisma.consentimento.findFirst.mockResolvedValue(consentimentoFake() as never);
      // revogarItem já silencia erros internamente (apenas warn); não relança
      pluggy.revogarItem.mockResolvedValue(undefined);
      prisma.consentimento.delete.mockResolvedValue(consentimentoFake() as never);

      await expect(service.revogar(1, 42)).resolves.toBeUndefined();
      expect(prisma.consentimento.delete).toHaveBeenCalled();
    });
  });

  // ─── EncryptionService (round-trip) ─────────────────────────────────────

  describe('EncryptionService — round-trip AES-256-GCM', () => {
    it('encrypt → decrypt retorna o valor original', () => {
      const configMock = {
        getOrThrow: jest.fn().mockReturnValue(
          '0000000000000000000000000000000000000000000000000000000000000000',
        ),
      };

      const enc = new EncryptionService(configMock as never);
      const original = 'item-id-secreto-123';
      const cifrado = enc.encrypt(original);

      expect(cifrado).not.toBe(original);
      expect(enc.decrypt(cifrado)).toBe(original);
    });
  });
});
