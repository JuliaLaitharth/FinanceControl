import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuditService } from '../audit/audit.service';
import { EncryptionService } from '../encryption/encryption.service';
import { PluggyAdapter } from '../pluggy/pluggy.adapter';
import { createPrismaMock } from '../test-utils/prisma.mock';
import { FiltroTransacaoDto } from './dto/filtro-transacao.dto';
import { TransacaoService } from './transacao.service';

// ─── Fakes ───────────────────────────────────────────────────────────────────

const contaFake = (overrides = {}) => ({
  id: 1,
  consentimentoId: 10,
  idExternoPluggy: 'acc-ext-1',
  tipo: 'CHECKING',
  numeroMascarado: '****1234',
  saldoAtual: 1000,
  moeda: 'BRL',
  ultimaSincronizacao: null,
  ...overrides,
});

const consentimentoFake = (overrides = {}) => ({
  id: 10,
  usuarioId: 42,
  instituicaoId: 1,
  itemIdPluggy: 'criptografado',
  status: 'ATIVO',
  contas: [contaFake()],
  ...overrides,
});

const txPluggyFake = (overrides = {}) => ({
  id: 'tx-ext-1',
  description: 'SUPERMERCADO EXTRA',
  amount: 150.5,
  type: 'DEBIT',
  date: '2026-11-01',
  ...overrides,
});

const txBdFake = (overrides = {}) => ({
  id: 1,
  contaId: 1,
  categoriaId: 1,
  idExternoPluggy: 'tx-ext-1',
  descricao: 'SUPERMERCADO EXTRA',
  valor: '150.50',
  tipo: 'DEBIT',
  data: new Date('2026-11-01'),
  metodoPagamento: null,
  categoriaAjustadaManualmente: false,
  categoria: { nome: 'Alimentação', icone: '🍽️' },
  conta: {
    numeroMascarado: '****1234',
    consentimento: { instituicao: { nome: 'Banco Sandbox' } },
  },
  ...overrides,
});

const categoriasFake = [
  { id: 1, nome: 'Alimentação' },
  { id: 2, nome: 'Transporte' },
  { id: 14, nome: 'Outros' },
];

// ─── Suíte ───────────────────────────────────────────────────────────────────

describe('TransacaoService', () => {
  let service: TransacaoService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let pluggy: jest.Mocked<PluggyAdapter>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(() => {
    prisma = createPrismaMock();
    pluggy = {
      buscarTransacoes: jest.fn(),
      criarConnectToken: jest.fn(),
      buscarContas: jest.fn(),
      buscarItem: jest.fn(),
      revogarItem: jest.fn(),
    } as unknown as jest.Mocked<PluggyAdapter>;
    audit = {
      registrar: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>;

    // EncryptionService real não é necessário; apenas criamos um stub
    const encryptionStub = {} as unknown as EncryptionService;
    service = new TransacaoService(prisma as never, pluggy, encryptionStub, audit);
  });

  // ─── listar ──────────────────────────────────────────────────────────────

  describe('listar()', () => {
    it('retorna lista paginada de transações do usuário', async () => {
      prisma.transacao.findMany.mockResolvedValue([txBdFake()] as never);
      prisma.transacao.count.mockResolvedValue(1);

      const filtro = new FiltroTransacaoDto();
      const result = await service.listar(42, filtro);

      expect(result.dados).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.pagina).toBe(1);
      expect(result.totalPaginas).toBe(1);
      expect(prisma.transacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            conta: { consentimento: { usuarioId: 42, status: 'ATIVO' } },
          }),
          orderBy: { data: 'desc' },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('aplica filtros de tipo e categoriaId no where', async () => {
      prisma.transacao.findMany.mockResolvedValue([] as never);
      prisma.transacao.count.mockResolvedValue(0);

      const filtro = Object.assign(new FiltroTransacaoDto(), {
        tipo: 'DEBIT',
        categoriaId: 1,
      });
      await service.listar(42, filtro);

      expect(prisma.transacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tipo: 'DEBIT', categoriaId: 1 }),
        }),
      );
    });

    it('respeita página e limite no skip/take', async () => {
      prisma.transacao.findMany.mockResolvedValue([] as never);
      prisma.transacao.count.mockResolvedValue(50);

      const filtro = Object.assign(new FiltroTransacaoDto(), { page: 3, limit: 10 });
      const result = await service.listar(42, filtro);

      expect(prisma.transacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.totalPaginas).toBe(5);
    });
  });

  // ─── sincronizar ─────────────────────────────────────────────────────────

  describe('sincronizar()', () => {
    it('busca transações do Pluggy, faz upsert e registra auditoria', async () => {
      prisma.categoria.findMany.mockResolvedValue(categoriasFake as never);
      prisma.consentimento.findMany.mockResolvedValue([consentimentoFake()] as never);
      pluggy.buscarTransacoes.mockResolvedValue([txPluggyFake()] as never);
      prisma.transacao.upsert.mockResolvedValue(txBdFake() as never);
      prisma.contaBancaria.update.mockResolvedValue(contaFake() as never);

      const result = await service.sincronizar(42, '127.0.0.1');

      expect(pluggy.buscarTransacoes).toHaveBeenCalledWith(
        'acc-ext-1',
        expect.any(Date),
        expect.any(Date),
      );
      expect(prisma.transacao.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idExternoPluggy: 'tx-ext-1' },
          create: expect.objectContaining({
            descricao: 'SUPERMERCADO EXTRA',
            tipo: 'DEBIT',
          }),
        }),
      );
      expect(prisma.contaBancaria.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      expect(audit.registrar).toHaveBeenCalledWith(
        42,
        'SINCRONIZACAO_REALIZADA',
        'transacao',
        '127.0.0.1',
      );
      expect(result.sincronizadas).toBe(1);
    });

    it('auto-categoriza "SUPERMERCADO" como Alimentação', async () => {
      prisma.categoria.findMany.mockResolvedValue(categoriasFake as never);
      prisma.consentimento.findMany.mockResolvedValue([consentimentoFake()] as never);
      pluggy.buscarTransacoes.mockResolvedValue([
        txPluggyFake({ description: 'SUPERMERCADO EXTRA' }),
      ] as never);
      prisma.transacao.upsert.mockResolvedValue(txBdFake() as never);
      prisma.contaBancaria.update.mockResolvedValue(contaFake() as never);

      await service.sincronizar(42);

      // Alimentação = categoria id 1
      expect(prisma.transacao.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ categoriaId: 1 }),
        }),
      );
    });

    it('usa categoria Outros como fallback para descrição desconhecida', async () => {
      prisma.categoria.findMany.mockResolvedValue(categoriasFake as never);
      prisma.consentimento.findMany.mockResolvedValue([consentimentoFake()] as never);
      pluggy.buscarTransacoes.mockResolvedValue([
        txPluggyFake({ description: 'LOJA DESCONHECIDA XYZ' }),
      ] as never);
      prisma.transacao.upsert.mockResolvedValue(txBdFake() as never);
      prisma.contaBancaria.update.mockResolvedValue(contaFake() as never);

      await service.sincronizar(42);

      // Outros = categoria id 14
      expect(prisma.transacao.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ categoriaId: 14 }),
        }),
      );
    });

    it('continua mesmo se a busca de uma conta falhar (tolerância a falha)', async () => {
      prisma.categoria.findMany.mockResolvedValue(categoriasFake as never);
      prisma.consentimento.findMany.mockResolvedValue([
        consentimentoFake({ contas: [contaFake({ id: 1 }), contaFake({ id: 2, idExternoPluggy: 'acc-ext-2' })] }),
      ] as never);
      pluggy.buscarTransacoes
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce([txPluggyFake()] as never);
      prisma.transacao.upsert.mockResolvedValue(txBdFake() as never);
      prisma.contaBancaria.update.mockResolvedValue(contaFake() as never);

      const result = await service.sincronizar(42);

      // A segunda conta ainda sincronizou
      expect(result.sincronizadas).toBe(1);
      expect(prisma.transacao.upsert).toHaveBeenCalledTimes(1);
    });
  });
});
