import type { Response } from 'express';
import { OauthService } from './oauth.service.js';
declare class LoginOAuthDto {
    email: string;
    senha: string;
    redirectUri: string;
    state: string;
}
declare class TokenDto {
    grant_type: string;
    code?: string;
    redirect_uri?: string;
    refresh_token?: string;
}
export declare class OauthController {
    private readonly oauthService;
    constructor(oauthService: OauthService);
    paginaAutorizar(redirectUri: string, state: string, res: Response): Response<any, Record<string, any>>;
    processarLogin(dto: LoginOAuthDto): Promise<{
        redirectTo: string;
    }>;
    token(dto: TokenDto): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
    }>;
}
export {};
