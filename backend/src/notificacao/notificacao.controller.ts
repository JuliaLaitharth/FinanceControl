import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { NotificacaoService } from './notificacao.service.js';

@Controller('notificacoes')
@UseGuards(JwtAuthGuard)
export class NotificacaoController {
  constructor(private readonly service: NotificacaoService) {}

  @Get()
  listar(
    @Request() req: { user: { sub: number } },
    @Query('naoLidas') naoLidas?: string,
  ) {
    return this.service.listar(req.user.sub, naoLidas === 'true');
  }

  @Get('contagem')
  contar(@Request() req: { user: { sub: number } }) {
    return this.service.contarNaoLidas(req.user.sub).then((n) => ({ naoLidas: n }));
  }

  @Patch(':id/ler')
  @HttpCode(HttpStatus.OK)
  marcarComoLida(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { sub: number } },
  ) {
    return this.service.marcarComoLida(id, req.user.sub);
  }

  @Patch('ler-todas')
  @HttpCode(HttpStatus.OK)
  marcarTodasComoLidas(@Request() req: { user: { sub: number } }) {
    return this.service.marcarTodasComoLidas(req.user.sub);
  }
}
