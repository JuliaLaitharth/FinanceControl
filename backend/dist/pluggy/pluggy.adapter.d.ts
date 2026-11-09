import { ConfigService } from '@nestjs/config';
export declare class PluggyAdapter {
    private readonly logger;
    private readonly clientId;
    private readonly clientSecret;
    private _client;
    constructor(config: ConfigService);
    private get client();
    criarConnectToken(itemId?: string): Promise<string>;
    buscarContas(itemId: string): Promise<import("pluggy-sdk").Account[]>;
    buscarTransacoes(accountId: string, de: Date, ate: Date): Promise<import("pluggy-sdk").Transaction[]>;
    buscarItem(itemId: string): Promise<import("pluggy-sdk").Item>;
    revogarItem(itemId: string): Promise<void>;
}
