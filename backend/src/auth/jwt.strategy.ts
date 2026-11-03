import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Além da assinatura, confere se a sessão ainda é válida (logout / troca de senha).
  async validate(payload: { sub: number; sid: string }) {
    const sessao = await this.prisma.sessao.findUnique({ where: { id: payload.sid } });
    if (!sessao || sessao.revogada || sessao.expiraEm < new Date()) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }
    return { userId: payload.sub, sessaoId: payload.sid };
  }
}