import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
export declare class OauthService {
    private readonly prisma;
    private readonly jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    validarCredenciais(email: string, senha: string): Promise<{
        id: number;
        email: string;
        nome: string;
        senhaHash: string;
        biometriaAtiva: boolean;
        dataCadastro: Date;
        ultimoLogin: Date | null;
        tentativasFalhas: number;
        bloqueadoAte: Date | null;
        fcmToken: string | null;
    }>;
    gerarCodigo(usuarioId: number, redirectUri: string): Promise<string>;
    trocarCodigo(code: string, redirectUri: string): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
        refresh_token: string;
    }>;
    refresharToken(refreshToken: string): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
    }>;
}
