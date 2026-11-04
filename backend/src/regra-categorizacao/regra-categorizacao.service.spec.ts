import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { createPrismaMock } from '../test-utils/prisma.mock';
import { CreateRegraCategoriacaoDto } from './dto/create-regra-categorizacao.dto';
import { RegraCategorizacaoService } from './regra-categorizacao.service';

const regraFake = (overrides = {}) => ({
  id: 1,
  usuarioId: 42,
  palavra: 'supermercado',
  categoriaId: 5,
  categoria: { nome: 'Alimentação' },
  ...overrides,
});

describe('RegraCategorizacaoService', () => {
  let service: RegraCategorizacaoService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(() => {
    prisma = createPrismaMock();
    audit = {
      registrar: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>;
    service = new RegraCategorizacaoService(prisma as never, audit);
  });

  describe('criar()', () => {
    it('normaliza a palavra, cria regra e audita', async () => {
      prisma.regraCategorizacao.create.mockResolvedValue(regraFake() as never);
      const dto: CreateRegraCategoriacaoDto = { palavra: 'SuperMercado', categoriaId: 5 };

      const result = await service.criar(dto, 42, '127.0.0.1');

      expect(prisma.regraCategorizacao.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ palavra: 'supermercado', usuarioId: 42 }),
        }),
      );
      expect(audit.registrar).toHaveBeenCalledWith(42, 'REGRA_CAT_CRIADA', 'regra_categorizacao', '127.0.0.1');
      expect(result.id).toBe(1);
    });
  });

  describe('listar()', () => {
    it('retorna regras do usuário', async () => {
      prisma.regraCategorizacao.findMany.mockResolvedValue([regraFake()] as never);

      const result = await service.listar(42);

      expect(result).toHaveLength(1);
      expect(prisma.regraCategorizacao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { usuarioId: 42 } }),
      );
    });
  });

  describe('excluir()', () => {
    it('exclui regra própria e audita', async () => {
      prisma.regraCategorizacao.findUnique.mockResolvedValue(regraFake() as never);
      prisma.regraCategorizacao.delete.mockResolvedValue(regraFake() as never);

      await service.excluir(1, 42, '127.0.0.1');

      expect(prisma.regraCategorizacao.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(audit.registrar).toHaveBeenCalledWith(42, 'REGRA_CAT_EXCLUIDA', 'regra_categorizacao', '127.0.0.1');
    });

    it('lança NotFoundException quando regra não existe', async () => {
      prisma.regraCategorizacao.findUnique.mockResolvedValue(null);

      await expect(service.excluir(99, 42)).rejects.toThrow(NotFoundException);
      expect(prisma.regraCategorizacao.delete).not.toHaveBeenCalled();
    });

    it('lança ForbiddenException quando usuário não é dono', async () => {
      prisma.regraCategorizacao.findUnique.mockResolvedValue(regraFake({ usuarioId: 99 }) as never);

      await expect(service.excluir(1, 42)).rejects.toThrow(ForbiddenException);
      expect(prisma.regraCategorizacao.delete).not.toHaveBeenCalled();
    });
  });
});
