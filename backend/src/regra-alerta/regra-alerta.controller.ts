import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateRegraAlertaDto } from './dto/create-regra-alerta.dto.js';
import { UpdateRegraAlertaDto } from './dto/update-regra-alerta.dto.js';
import { RegraAlertaService } from './regra-alerta.service.js';

@Controller('regras-alerta')
@UseGuards(JwtAuthGuard)
export class RegraAlertaController {
  constructor(private readonly service: RegraAlertaService) {}

  @Post()
  criar(
    @Body() dto: CreateRegraAlertaDto,
    @Request() req: { user: { sub: number }; ip: string },
  ) {
    return this.service.criar(dto, req.user.sub, req.ip);
  }

  @Get()
  listar(@Request() req: { user: { sub: number } }) {
    return this.service.listar(req.user.sub);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRegraAlertaDto,
    @Request() req: { user: { sub: number }; ip: string },
  ) {
    return this.service.atualizar(id, dto, req.user.sub, req.ip);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  excluir(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: { sub: number }; ip: string },
  ) {
    return this.service.excluir(id, req.user.sub, req.ip);
  }
}
