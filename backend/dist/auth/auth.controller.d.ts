import { LgpdService } from '../lgpd/lgpd.service';
import { AuthService } from './auth.service';
import { BiometriaDto } from './dto/biometria.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
declare class FcmTokenDto {
    token: string;
}
declare class AlexaIdDto {
    alexaUserId: string;
}
declare class AtualizarPerfilDto {
    nome: string;
}
declare class AlterarSenhaDto {
    senhaAtual: string;
    novaSenha: string;
}
interface AuthRequest {
    user: {
        userId: number;
        sessaoId: string;
    };
}
export declare class AuthController {
    private readonly auth;
    private readonly lgpd;
    constructor(auth: AuthService, lgpd: LgpdService);
    register(dto: RegisterDto, ip: string): Promise<{
        usuario: {
            id: number;
            nome: string;
            email: string;
            biometriaAtiva: boolean;
        };
        accessToken: string;
        refreshToken: string;
        expiraEm: Date;
    }>;
    login(dto: LoginDto, ip: string): Promise<{
        usuario: {
            id: number;
            nome: string;
            email: string;
            biometriaAtiva: boolean;
        };
        accessToken: string;
        refreshToken: string;
        expiraEm: Date;
    }>;
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: string;
        expiraEm: Date;
    }>;
    forgotPassword(dto: ForgotPasswordDto, ip: string): Promise<{
        mensagem: string;
    }>;
    resetPassword(dto: ResetPasswordDto, ip: string): Promise<{
        mensagem: string;
    }>;
    logout(req: AuthRequest, ip: string): Promise<void>;
    biometria(req: AuthRequest, dto: BiometriaDto, ip: string): Promise<{
        id: number;
        nome: string;
        email: string;
        biometriaAtiva: boolean;
    }>;
    me(req: AuthRequest): Promise<{
        id: number;
        nome: string;
        email: string;
        biometriaAtiva: boolean;
    }>;
    registrarFcmToken(req: AuthRequest, dto: FcmTokenDto): Promise<void>;
    vincularAlexaId(req: AuthRequest, dto: AlexaIdDto): Promise<void>;
    atualizarPerfil(req: AuthRequest, dto: AtualizarPerfilDto): Promise<{
        id: number;
        nome: string;
        email: string;
        biometriaAtiva: boolean;
    }>;
    alterarSenha(req: AuthRequest, dto: AlterarSenhaDto, ip: string): Promise<{
        mensagem: string;
    }>;
    excluirConta(req: AuthRequest, ip: string): Promise<void>;
}
export {};
