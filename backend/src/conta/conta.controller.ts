import { Controller, Get, Ip, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContaService } from './conta.service';

interface AuthRequest {
  user: { userId: number };
}

@UseGuards(JwtAuthGuard)
@Controller('contas')
export class ContaController {
  constructor(private readonly service: ContaService) {}

  /** GET /contas/saldo — saldo consolidado (total + por instituição). */
  @Get('saldo')
  saldo(@Req() req: AuthRequest, @Ip() ip: string) {
    return this.service.saldoConsolidado(req.user.userId, ip);
  }

  /** GET /contas — lista contas bancárias do usuário. */
  @Get()
  listar(@Req() req: AuthRequest, @Ip() ip: string) {
    return this.service.listar(req.user.userId, ip);
  }
}
