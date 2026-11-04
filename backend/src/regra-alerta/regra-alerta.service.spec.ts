import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { createPrismaMock } from '../test-utils/prisma.mock';
import { CreateRegraAlertaDto } from './dto/create-regra-alerta.dto';
import { UpdateRegraAlertaDto } from './dto/update-regra-alerta.dto';
import { RegraAlertaService } from './regra-alerta.service';

const regraFake = (overrides = {}) => ({
  id: 1,
  usuarioId: 42,
  tipoEvento: 'TRANSACAO_GRANDE',
  operador: 'MAIOR_QUE',
  valorLimite: 500,
  categoriaId: null,
  canal: 'PUSH',
  ativa: true,
  dataCriacao: new Date(),
  ...overrides,
});

describe('RegraAlertaService', () => {
  let service: RegraAlertaService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(() => {
    prisma = createPrismaMock();
    audit = {
      registrar: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>;
    service = new RegraAlertaService(prisma as never, audit);
  });

  // ─── criar ───────────────────────────────────────────────────────────────

  describe('criar()', () => {
    it('cria regra e registra auditoria', async () => {
      prisma.regraAlerta.create.mockResolvedValue(regraFake() as never);
      const dto: CreateRegraAlertaDto = {
        tipoEvento: 'TRANSACAO_GRANDE',
        operador: 'MAIOR_QUE',
        valorLimite: 500,
        canal: 'PUSH',
      };

      const result = await service.criar(dto, 42, '127.0.0.1');

      expect(prisma.regraAlerta.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ usuarioId: 42, tipoEvento: 'TRANSACAO_GRANDE' }),
        }),
      );
      expect(audit.registrar).toHaveBeenCalledWith(42, 'REGRA_CRIADA', 'regra_alerta', '127.0.0.1');
      expect(result.id).toBe(1);
    });
  });

  // ─── listar ──────────────────────────────────────────────────────────────

  describe('listar()', () => {
    it('retorna regras do usuário', async () => {
      prisma.regraAlerta.findMany.mockResolvedValue([regraFake()] as never);

      const result = await service.listar(42);

      expect(result).toHaveLength(1);
      expect(prisma.regraAlerta.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { usuarioId: 42 } }),
      );
    });
  });

  // ─── atualizar ───────────────────────────────────────────────────────────

  describe('atualizar()', () => {
    it('atualiza regra pertencente ao usuário', async () => {
      prisma.regraAlerta.findUnique.mockResolvedValue(regraFake() as never);
      const updated = regraFake({ ativa: false });
      prisma.regraAlerta.update.mockResolvedValue(updated as never);
      const dto = { ativa: false } as UpdateRegraAlertaDto;

      const result = await service.atualizar(1, dto, 42);

      expect(prisma.regraAlerta.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      expect(result.ativa).toBe(false);
    });

    it('lança ForbiddenException quando usuário não é dono', async () => {
      prisma.regraAlerta.findUnique.mockResolvedValue(
        regraFake({ usuarioId: 99 }) as never,
      );

      await expect(
        service.atualizar(1, {} as UpdateRegraAlertaDto, 42),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── excluir ─────────────────────────────────────────────────────────────

  describe('excluir()', () => {
    it('exclui regra e registra auditoria', async () => {
      prisma.regraAlerta.findUnique.mockResolvedValue(regraFake() as never);
      prisma.regraAlerta.delete.mockResolvedValue(regraFake() as never);

      await service.excluir(1, 42, '127.0.0.1');

      expect(prisma.regraAlerta.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(audit.registrar).toHaveBeenCalledWith(42, 'REGRA_EXCLUIDA', 'regra_alerta', '127.0.0.1');
    });

    it('lança NotFoundException quando regra não existe', async () => {
      prisma.regraAlerta.findUnique.mockResolvedValue(null);

      await expect(service.excluir(99, 42)).rejects.toThrow(NotFoundException);
      expect(prisma.regraAlerta.delete).not.toHaveBeenCalled();
    });
  });
});
