"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrismaMock = void 0;
const globals_1 = require("@jest/globals");
const makeTableMock = () => ({
    findUnique: globals_1.jest.fn(),
    findUniqueOrThrow: globals_1.jest.fn(),
    findFirst: globals_1.jest.fn(),
    findMany: globals_1.jest.fn(),
    create: globals_1.jest.fn(),
    createMany: globals_1.jest.fn(),
    update: globals_1.jest.fn(),
    updateMany: globals_1.jest.fn(),
    delete: globals_1.jest.fn(),
    deleteMany: globals_1.jest.fn(),
    upsert: globals_1.jest.fn(),
    count: globals_1.jest.fn(),
});
const createPrismaMock = () => ({
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
    codigoOAuth: makeTableMock(),
    regraCategorizacao: makeTableMock(),
    instituicao: makeTableMock(),
    $transaction: globals_1.jest.fn(),
    $connect: globals_1.jest.fn(),
    $disconnect: globals_1.jest.fn(),
});
exports.createPrismaMock = createPrismaMock;
//# sourceMappingURL=prisma.mock.js.map