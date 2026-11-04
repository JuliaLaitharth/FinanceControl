import { jest } from '@jest/globals';
import { PrismaService } from '../prisma/prisma.service';

type DeepMockOf<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown
    ? jest.MockedFunction<T[K]>
    : DeepMockOf<T[K]>;
};

const makeTableMock = () => ({
  findUnique: jest.fn(),
  findUniqueOrThrow: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  upsert: jest.fn(),
  count: jest.fn(),
});

export const createPrismaMock = (): DeepMockOf<PrismaService> =>
  ({
    usuario: makeTableMock(),
    tokenRecuperacao: makeTableMock(),
    vinculoAlexa: makeTableMock(),
    sessao: makeTableMock(),
    logAuditoria: makeTableMock(),
    consentimento: makeTableMock(),
    contaBancaria: makeTableMock(),
    transacao: makeTableMock(),
    categoria: makeTableMock(),
    regraAlerta: makeTableMock(),
    notificacao: makeTableMock(),
    codigoOauth: makeTableMock(),
    instituicao: makeTableMock(),
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  }) as unknown as DeepMockOf<PrismaService>;
