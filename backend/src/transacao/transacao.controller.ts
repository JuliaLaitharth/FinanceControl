import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { IsInt, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

class AjustarCategoriaDto {
  @IsInt()
  @Min(1)
  categoriaId!: number;
}
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

  @Patch(':id/categoria')
  ajustarCategoria(
    @Request() req: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AjustarCategoriaDto,
  ) {
    return this.service.ajustarCategoria(id, dto.categoriaId, req.user.sub);
  }

  @Post('sincronizar')
  @HttpCode(HttpStatus.OK)
  sincronizar(@Request() req: { user: { sub: number }; ip: string }) {
    return this.service.sincronizar(req.user.sub, req.ip);
  }
}
