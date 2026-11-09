import { jest } from '@jest/globals';
import { PrismaService } from '../prisma/prisma.service';
type DeepMockOf<T> = {
    [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? jest.MockedFunction<T[K]> : DeepMockOf<T[K]>;
};
export declare const createPrismaMock: () => DeepMockOf<PrismaService>;
export {};
