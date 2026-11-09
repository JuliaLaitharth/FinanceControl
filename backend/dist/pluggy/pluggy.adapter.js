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
var PluggyAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluggyAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pluggy_sdk_1 = require("pluggy-sdk");
let PluggyAdapter = PluggyAdapter_1 = class PluggyAdapter {
    logger = new common_1.Logger(PluggyAdapter_1.name);
    clientId;
    clientSecret;
    _client = null;
    constructor(config) {
        this.clientId = config.getOrThrow('PLUGGY_CLIENT_ID');
        this.clientSecret = config.getOrThrow('PLUGGY_CLIENT_SECRET');
    }
    get client() {
        if (!this._client) {
            this._client = new pluggy_sdk_1.PluggyClient({
                clientId: this.clientId,
                clientSecret: this.clientSecret,
            });
        }
        return this._client;
    }
    async criarConnectToken(itemId) {
        try {
            const { accessToken } = await this.client.createConnectToken(itemId ?? undefined);
            return accessToken;
        }
        catch (err) {
            this.logger.error('Erro ao criar connect token Pluggy', err);
            throw new common_1.ServiceUnavailableException('Serviço de conexão bancária indisponível no momento.');
        }
    }
    async buscarContas(itemId) {
        try {
            const { results } = await this.client.fetchAccounts(itemId);
            return results;
        }
        catch (err) {
            this.logger.error(`Erro ao buscar contas do item ${itemId}`, err);
            throw new common_1.ServiceUnavailableException('Não foi possível sincronizar as contas bancárias.');
        }
    }
    async buscarTransacoes(accountId, de, ate) {
        try {
            const { results } = await this.client.fetchTransactions(accountId, {
                from: de.toISOString().split('T')[0],
                to: ate.toISOString().split('T')[0],
                pageSize: 500,
            });
            return results;
        }
        catch (err) {
            this.logger.error(`Erro ao buscar transações da conta ${accountId}`, err);
            throw new common_1.ServiceUnavailableException('Não foi possível buscar as transações.');
        }
    }
    async buscarItem(itemId) {
        try {
            return await this.client.fetchItem(itemId);
        }
        catch (err) {
            this.logger.error(`Erro ao buscar item ${itemId}`, err);
            throw new common_1.ServiceUnavailableException('Não foi possível verificar o status da conexão.');
        }
    }
    async revogarItem(itemId) {
        try {
            await this.client.deleteItem(itemId);
        }
        catch (err) {
            this.logger.warn(`Falha ao revogar item ${itemId} no Pluggy (continuando revogação local)`, err);
        }
    }
};
exports.PluggyAdapter = PluggyAdapter;
exports.PluggyAdapter = PluggyAdapter = PluggyAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PluggyAdapter);
//# sourceMappingURL=pluggy.adapter.js.map