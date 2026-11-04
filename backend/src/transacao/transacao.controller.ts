import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { FiltroTransacaoDto } from './dto/filtro-transacao.dto.js';
import { TransacaoService } from './transacao.service.js';

@Controller('transacoes')
@UseGuards(JwtAuthGuard)
export class TransacaoController {
  constructor(private readonly service: TransacaoService) {}

  @Get()
  listar(
    @Request() req: { user: { sub: number } },
    @Query() filtro: FiltroTransacaoDto,
  ) {
    return this.service.listar(req.user.sub, filtro);
  }

  @Get('resumo-categorias')
  resumoCategorias(
    @Request() req: { user: { sub: number } },
    @Query('dataInicio') dataInicio?: string,
  ) {
    return this.service.resumoCategorias(req.user.sub, dataInicio);
  }

  @Post('sincronizar')
  @HttpCode(HttpStatus.OK)
  sincronizar(@Request() req: { user: { sub: number }; ip: string }) {
    return this.service.sincronizar(req.user.sub, req.ip);
  }
}
