import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateRegraCategoriacaoDto } from './dto/create-regra-categorizacao.dto.js';
import { RegraCategorizacaoService } from './regra-categorizacao.service.js';

@Controller('regras-categorizacao')
@UseGuards(JwtAuthGuard)
export class RegraCategorizacaoController {
  constructor(private readonly service: RegraCategorizacaoService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  criar(
    @Request() req: { user: { sub: number } },
    @Body() dto: CreateRegraCategoriacaoDto,
    @Ip() ip: string,
  ) {
    return this.service.criar(dto, req.user.sub, ip);
  }

  @Get()
  listar(@Request() req: { user: { sub: number } }) {
    return this.service.listar(req.user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async excluir(
    @Request() req: { user: { sub: number } },
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    await this.service.excluir(id, req.user.sub, ip);
  }
}
