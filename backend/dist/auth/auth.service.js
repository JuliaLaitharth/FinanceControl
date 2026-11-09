"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const crypto_1 = require("crypto");
const audit_service_1 = require("../audit/audit.service");
const mail_service_1 = require("../mail/mail.service");
const prisma_service_1 = require("../prisma/prisma.service");
const BCRYPT_ROUNDS = 12;
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;
const SESSAO_DIAS = 30;
const RECUPERACAO_MINUTOS = 30;
const MSG_CREDENCIAIS = 'E-mail ou senha incorretos';
const MSG_LINK_INVALIDO = 'Link expirado ou inválido. Solicite um novo link.';
const MSG_SESSAO = 'Sessão expirada. Faça login novamente.';
const sha256 = (valor) => (0, crypto_1.createHash)('sha256').update(valor).digest('hex');
const emMinutos = (min) => new Date(Date.now() + min * 60_000);
const emDias = (dias) => new Date(Date.now() + dias * 86_400_000);
let AuthService = class AuthService {
    prisma;
    jwt;
    audit;
    mail;
    hashFalso = bcrypt.hashSync('senha-falsa-1', BCRYPT_ROUNDS);
    constructor(prisma, jwt, audit, mail) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.audit = audit;
        this.mail = mail;
    }
    async register(dto, ip) {
        const existente = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
        if (existente)
            throw new common_1.ConflictException('E-mail já cadastrado');
        const senhaHash = await bcrypt.hash(dto.senha, BCRYPT_ROUNDS);
        let usuario;
        try {
            usuario = await this.prisma.usuario.create({
                data: { nome: dto.nome, email: dto.email, senhaHash },
            });
        }
        catch (erro) {
            if (erro instanceof client_1.Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
                throw new common_1.ConflictException('E-mail já cadastrado');
            }
            throw erro;
        }
        await this.audit.registrar(usuario.id, 'CADASTRO', 'usuario', ip);
        const tokens = await this.iniciarSessao(usuario.id);
        return { ...tokens, usuario: this.publico(usuario) };
    }
    async login(dto, ip) {
        const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
        if (!usuario) {
            await bcrypt.compare(dto.senha, this.hashFalso);
            throw new common_1.UnauthorizedException(MSG_CREDENCIAIS);
        }
        if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
            const minutos = Math.ceil((usuario.bloqueadoAte.getTime() - Date.now()) / 60_000);
            await this.audit.registrar(usuario.id, 'LOGIN_BLOQUEADO', 'usuario', ip);
            throw new common_1.HttpException(`Muitas tentativas inválidas. Tente novamente em ${minutos} minuto(s).`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const senhaConfere = await bcrypt.compare(dto.senha, usuario.senhaHash);
        if (!senhaConfere) {
            const atualizado = await this.prisma.usuario.update({
                where: { id: usuario.id },
                data: { tentativasFalhas: { increment: 1 } },
            });
            if (atualizado.tentativasFalhas >= MAX_TENTATIVAS) {
                await this.prisma.usuario.update({
                    where: { id: usuario.id },
                    data: { tentativasFalhas: 0, bloqueadoAte: emMinutos(BLOQUEIO_MINUTOS) },
                });
            }
            await this.audit.registrar(usuario.id, 'LOGIN_FALHA', 'usuario', ip);
            throw new common_1.UnauthorizedException(MSG_CREDENCIAIS);
        }
        const atualizado = await this.prisma.usuario.update({
            where: { id: usuario.id },
            data: { tentativasFalhas: 0, bloqueadoAte: null, ultimoLogin: new Date() },
        });
        await this.audit.registrar(usuario.id, 'LOGIN', 'usuario', ip);
        const tokens = await this.iniciarSessao(usuario.id);
        return { ...tokens, usuario: this.publico(atualizado) };
    }
    async refresh(dto) {
        const sessao = await this.prisma.sessao.findUnique({
            where: { refreshHash: sha256(dto.refreshToken) },
        });
        if (!sessao || sessao.revogada || sessao.expiraEm < new Date()) {
            throw new common_1.UnauthorizedException(MSG_SESSAO);
        }
        const novoRefresh = (0, crypto_1.randomBytes)(48).toString('hex');
        const expiraEm = emDias(SESSAO_DIAS);
        await this.prisma.sessao.update({
            where: { id: sessao.id },
            data: { refreshHash: sha256(novoRefresh), expiraEm },
        });
        const accessToken = await this.jwt.signAsync({ sub: sessao.usuarioId, sid: sessao.id });
        return { accessToken, refreshToken: novoRefresh, expiraEm };
    }
    async logout(usuarioId, sessaoId, ip) {
        await this.prisma.sessao.update({ where: { id: sessaoId }, data: { revogada: true } });
        await this.audit.registrar(usuarioId, 'LOGOUT', 'sessao', ip);
    }
    async forgotPassword(dto, ip) {
        const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
        if (usuario) {
            await this.prisma.tokenRecuperacao.updateMany({
                where: { usuarioId: usuario.id, usado: false },
                data: { usado: true },
            });
            const token = (0, crypto_1.randomBytes)(32).toString('hex');
            await this.prisma.tokenRecuperacao.create({
                data: {
                    usuarioId: usuario.id,
                    token: sha256(token),
                    expiraEm: emMinutos(RECUPERACAO_MINUTOS),
                },
            });
            await this.mail.enviarRecuperacaoSenha(usuario.email, token);
            await this.audit.registrar(usuario.id, 'RECUPERACAO_SOLICITADA', 'usuario', ip);
        }
        return {
            mensagem: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.',
        };
    }
    async resetPassword(dto, ip) {
        const registro = await this.prisma.tokenRecuperacao.findUnique({
            where: { token: sha256(dto.token) },
        });
        if (!registro || registro.usado || registro.expiraEm < new Date()) {
            throw new common_1.BadRequestException(MSG_LINK_INVALIDO);
        }
        const senhaHash = await bcrypt.hash(dto.novaSenha, BCRYPT_ROUNDS);
        await this.prisma.$transaction(async (tx) => {
            const marcado = await tx.tokenRecuperacao.updateMany({
                where: { id: registro.id, usado: false },
                data: { usado: true },
            });
            if (marcado.count === 0)
                throw new common_1.BadRequestException(MSG_LINK_INVALIDO);
            await tx.usuario.update({
                where: { id: registro.usuarioId },
                data: { senhaHash, tentativasFalhas: 0, bloqueadoAte: null },
            });
            await tx.sessao.updateMany({
                where: { usuarioId: registro.usuarioId, revogada: false },
                data: { revogada: true },
            });
        });
        await this.audit.registrar(registro.usuarioId, 'SENHA_REDEFINIDA', 'usuario', ip);
        return { mensagem: 'Senha redefinida com sucesso. Faça login novamente.' };
    }
    async alterarBiometria(usuarioId, ativa, ip) {
        const usuario = await this.prisma.usuario.update({
            where: { id: usuarioId },
            data: { biometriaAtiva: ativa },
        });
        await this.audit.registrar(usuarioId, ativa ? 'BIOMETRIA_ATIVADA' : 'BIOMETRIA_DESATIVADA', 'usuario', ip);
        return this.publico(usuario);
    }
    async me(usuarioId) {
        const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
        return this.publico(usuario);
    }
    async registrarFcmToken(usuarioId, token) {
        await this.prisma.usuario.update({
            where: { id: usuarioId },
            data: { fcmToken: token },
        });
    }
    async atualizarPerfil(usuarioId, nome) {
        const usuario = await this.prisma.usuario.update({
            where: { id: usuarioId },
            data: { nome },
        });
        await this.audit.registrar(usuarioId, 'PERFIL_ATUALIZADO', 'usuario');
        return this.publico(usuario);
    }
    async alterarSenha(usuarioId, senhaAtual, novaSenha, ip) {
        const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
        const ok = await bcrypt.compare(senhaAtual, usuario.senhaHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Senha atual incorreta');
        const senhaHash = await bcrypt.hash(novaSenha, BCRYPT_ROUNDS);
        await this.prisma.$transaction(async (tx) => {
            await tx.usuario.update({ where: { id: usuarioId }, data: { senhaHash } });
            await tx.sessao.updateMany({ where: { usuarioId, revogada: false }, data: { revogada: true } });
        });
        await this.audit.registrar(usuarioId, 'SENHA_ALTERADA', 'usuario', ip);
        return { mensagem: 'Senha alterada com sucesso. Faça login novamente.' };
    }
    async vincularAlexaId(usuarioId, alexaUserId) {
        await this.prisma.vinculoAlexa.updateMany({
            where: { usuarioId, ativo: true },
            data: { alexaUserId },
        });
    }
    async iniciarSessao(usuarioId) {
        const refreshToken = (0, crypto_1.randomBytes)(48).toString('hex');
        const sessao = await this.prisma.sessao.create({
            data: { usuarioId, refreshHash: sha256(refreshToken), expiraEm: emDias(SESSAO_DIAS) },
        });
        const accessToken = await this.jwt.signAsync({ sub: usuarioId, sid: sessao.id });
        return { accessToken, refreshToken, expiraEm: sessao.expiraEm };
    }
    publico(usuario) {
        return {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            biometriaAtiva: usuario.biometriaAtiva,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        audit_service_1.AuditService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map