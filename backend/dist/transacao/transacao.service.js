"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TransacaoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransacaoService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_js_1 = require("../audit/audit.service.js");
const encryption_service_js_1 = require("../encryption/encryption.service.js");
const pluggy_adapter_js_1 = require("../pluggy/pluggy.adapter.js");
const prisma_service_js_1 = require("../prisma/prisma.service.js");
const KEYWORDS = {
    Alimentação: ['mercado', 'supermercado', 'restaurante', 'lanchonete', 'padaria', 'pizza', 'ifood', 'delivery', 'burguer'],
    Transporte: ['uber', '99pop', 'taxi', 'combustivel', 'gasolina', 'etanol', 'posto', 'estacionamento', 'onibus', 'metro'],
    Moradia: ['aluguel', 'condominio', 'iptu', 'energia', 'enel', 'cemig', 'sabesp', 'internet', 'compesa'],
    Saúde: ['farmacia', 'remedio', 'hospital', 'clinica', 'medico', 'exame', 'saude', 'drogaria'],
    Educação: ['escola', 'faculdade', 'curso', 'mensalidade', 'colegio', 'udemy', 'alura'],
    Lazer: ['cinema', 'teatro', 'show', 'netflix', 'spotify', 'amazon', 'steam', 'jogo', 'entretenimento', 'disney'],
    'Pix enviado': ['pix enviado', 'ted enviado', 'doc enviado'],
    'Pix recebido': ['pix recebido', 'ted recebido', 'doc recebido'],
    Renda: ['salario', 'folha pagamento'],
    Transferência: ['transferencia', 'transf'],
    Investimentos: ['investimento', 'aplicacao', 'resgate', 'fundo', 'cdb', 'tesouro'],
};
function normalizar(str) {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}
let TransacaoService = TransacaoService_1 = class TransacaoService {
    prisma;
    pluggy;
    encryption;
    audit;
    logger = new common_1.Logger(TransacaoService_1.name);
    constructor(prisma, pluggy, encryption, audit) {
        this.prisma = prisma;
        this.pluggy = pluggy;
        this.encryption = encryption;
        this.audit = audit;
    }
    async listar(usuarioId, filtro) {
        const page = filtro.page ?? 1;
        const limit = filtro.limit ?? 20;
        const where = {
            conta: { consentimento: { usuarioId, status: 'ATIVO' } },
        };
        if (filtro.de || filtro.ate) {
            where['data'] = {
                ...(filtro.de ? { gte: new Date(filtro.de) } : {}),
                ...(filtro.ate ? { lte: new Date(filtro.ate) } : {}),
            };
        }
        if (filtro.categoriaId)
            where['categoriaId'] = filtro.categoriaId;
        if (filtro.tipo)
            where['tipo'] = filtro.tipo;
        if (filtro.contaId)
            where['contaId'] = filtro.contaId;
        const [dados, total] = await Promise.all([
            this.prisma.transacao.findMany({
                where: where,
                include: {
                    categoria: { select: { nome: true, icone: true } },
                    conta: {
                        select: {
                            numeroMascarado: true,
                            consentimento: {
                                include: { instituicao: { select: { nome: true } } },
                            },
                        },
                    },
                },
                orderBy: { data: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.transacao.count({ where: where }),
        ]);
        return {
            dados,
            total,
            pagina: page,
            porPagina: limit,
            totalPaginas: Math.ceil(total / limit),
        };
    }
    async sincronizar(usuarioId, ip) {
        const [categorias, regrasUsuario] = await Promise.all([
            this.prisma.categoria.findMany({
                where: { padraoSistema: true },
                select: { id: true, nome: true },
            }),
            this.prisma.regraCategorizacao.findMany({
                where: { usuarioId },
                select: { palavra: true, categoriaId: true },
            }),
        ]);
        const consentimentos = await this.prisma.consentimento.findMany({
            where: { usuarioId, status: 'ATIVO' },
            include: { contas: true },
        });
        const noventa = new Date(Date.now() - 90 * 86_400_000);
        const hoje = new Date();
        let sincronizadas = 0;
        for (const c of consentimentos) {
            for (const conta of c.contas) {
                try {
                    const txs = await this.pluggy.buscarTransacoes(conta.idExternoPluggy, noventa, hoje);
                    for (const tx of txs) {
                        const categoriaId = this.categorizarAuto(tx.description ?? '', categorias, regrasUsuario);
                        await this.prisma.transacao.upsert({
                            where: { idExternoPluggy: tx.id },
                            create: {
                                contaId: conta.id,
                                idExternoPluggy: tx.id,
                                descricao: tx.description ?? 'Sem descrição',
                                valor: tx.amount,
                                tipo: tx.type,
                                data: new Date(tx.date),
                                metodoPagamento: tx['paymentData']
                                    ? String(tx['paymentData']?.['paymentMethod'] ?? '')
                                    : null,
                                categoriaId,
                            },
                            update: {},
                        });
                        sincronizadas++;
                    }
                    await this.prisma.contaBancaria.update({
                        where: { id: conta.id },
                        data: { ultimaSincronizacao: new Date() },
                    });
                }
                catch (err) {
                    this.logger.warn(`Erro ao sincronizar conta ${conta.id}: ${String(err)}`);
                }
            }
        }
        await this.audit.registrar(usuarioId, 'SINCRONIZACAO_REALIZADA', 'transacao', ip);
        this.logger.log(`Sincronizadas ${sincronizadas} transações para usuário ${usuarioId}`);
        return { sincronizadas };
    }
    async resumoMensal(usuarioId, meses = 6) {
        const agora = new Date();
        const inicio = new Date(agora.getFullYear(), agora.getMonth() - (meses - 1), 1);
        const transacoes = await this.prisma.transacao.findMany({
            where: {
                conta: { consentimento: { usuarioId, status: 'ATIVO' } },
                data: { gte: inicio },
            },
            select: { valor: true, tipo: true, data: true },
        });
        const mapa = {};
        for (let i = meses - 1; i >= 0; i--) {
            const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            mapa[key] = { receitas: 0, despesas: 0 };
        }
        for (const tx of transacoes) {
            const key = `${tx.data.getFullYear()}-${String(tx.data.getMonth() + 1).padStart(2, '0')}`;
            if (mapa[key]) {
                const valor = Number(tx.valor);
                if (tx.tipo === 'CREDIT')
                    mapa[key].receitas += valor;
                else
                    mapa[key].despesas += valor;
            }
        }
        const result = Object.entries(mapa).map(([mes, { receitas, despesas }]) => ({
            mes,
            receitas: Math.round(receitas * 100) / 100,
            despesas: Math.round(despesas * 100) / 100,
            saldo: Math.round((receitas - despesas) * 100) / 100,
        }));
        return { meses: result };
    }
    async resumoCategorias(usuarioId, dataInicio) {
        const inicio = dataInicio
            ? new Date(dataInicio)
            : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const transacoes = await this.prisma.transacao.findMany({
            where: {
                conta: { consentimento: { usuarioId, status: 'ATIVO' } },
                tipo: 'DEBIT',
                data: { gte: inicio },
            },
            include: { categoria: { select: { nome: true } } },
        });
        const mapa = {};
        for (const tx of transacoes) {
            const nome = tx.categoria?.nome ?? 'Outros';
            mapa[nome] = (mapa[nome] ?? 0) + Number(tx.valor);
        }
        const categorias = Object.entries(mapa)
            .map(([nome, total]) => ({ nome, total: Math.round(total * 100) / 100 }))
            .sort((a, b) => b.total - a.total);
        return { categorias };
    }
    async ajustarCategoria(transacaoId, categoriaId, usuarioId) {
        const tx = await this.prisma.transacao.findFirst({
            where: {
                id: transacaoId,
                conta: { consentimento: { usuarioId, status: 'ATIVO' } },
            },
        });
        if (!tx) {
            const { NotFoundException } = await import('@nestjs/common');
            throw new NotFoundException('Transação não encontrada');
        }
        return this.prisma.transacao.update({
            where: { id: transacaoId },
            data: { categoriaId, categoriaAjustadaManualmente: true },
        });
    }
    categorizarAuto(descricao, categorias, regrasUsuario = []) {
        const descNorm = normalizar(descricao);
        for (const regra of regrasUsuario) {
            if (descNorm.includes(normalizar(regra.palavra))) {
                return regra.categoriaId;
            }
        }
        for (const [nome, keywords] of Object.entries(KEYWORDS)) {
            if (keywords.some((kw) => descNorm.includes(kw))) {
                const cat = categorias.find((c) => c.nome === nome);
                if (cat)
                    return cat.id;
            }
        }
        return categorias.find((c) => c.nome === 'Outros')?.id ?? null;
    }
};
exports.TransacaoService = TransacaoService;
exports.TransacaoService = TransacaoService = TransacaoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_js_1.PrismaService,
        pluggy_adapter_js_1.PluggyAdapter,
        encryption_service_js_1.EncryptionService,
        audit_service_js_1.AuditService])
], TransacaoService);
//# sourceMappingURL=transacao.service.js.map