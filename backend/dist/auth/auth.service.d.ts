import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly audit;
    private readonly mail;
    private readonly hashFalso;
    constructor(prisma: PrismaService, jwt: JwtService, audit: AuditService, mail: MailService);
    register(dto: RegisterDto, ip?: string): Promise<{
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
    login(dto: LoginDto, ip?: string): Promise<{
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
    logout(usuarioId: number, sessaoId: string, ip?: string): Promise<void>;
    forgotPassword(dto: ForgotPasswordDto, ip?: string): Promise<{
        mensagem: string;
    }>;
    resetPassword(dto: ResetPasswordDto, ip?: string): Promise<{
        mensagem: string;
    }>;
    alterarBiometria(usuarioId: number, ativa: boolean, ip?: string): Promise<{
        id: number;
        nome: string;
        email: string;
        biometriaAtiva: boolean;
    }>;
    me(usuarioId: number): Promise<{
        id: number;
        nome: string;
        email: string;
        biometriaAtiva: boolean;
    }>;
    registrarFcmToken(usuarioId: number, token: string): Promise<void>;
    atualizarPerfil(usuarioId: number, nome: string): Promise<{
        id: number;
        nome: string;
        email: string;
        biometriaAtiva: boolean;
    }>;
    alterarSenha(usuarioId: number, senhaAtual: string, novaSenha: string, ip?: string): Promise<{
        mensagem: string;
    }>;
    vincularAlexaId(usuarioId: number, alexaUserId: string): Promise<void>;
    private iniciarSessao;
    private publico;
}
