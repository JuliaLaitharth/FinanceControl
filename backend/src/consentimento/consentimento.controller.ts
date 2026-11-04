import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Ip,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsentimentoService } from './consentimento.service';
import { CreateConsentimentoDto } from './dto/create-consentimento.dto';

interface AuthRequest {
  user: { userId: number };
}

@UseGuards(JwtAuthGuard)
@Controller('consentimentos')
export class ConsentimentoController {
  constructor(private readonly service: ConsentimentoService) {}

  /** Gera connect token para o Pluggy Widget. */
  @Post('connect-token')
  @HttpCode(200)
  gerarConnectToken(@Req() req: AuthRequest) {
    return this.service.gerarConnectToken(req.user.userId);
  }

  /** Registra consentimento após autorização no widget. */
  @Post()
  criar(@Body() dto: CreateConsentimentoDto, @Req() req: AuthRequest, @Ip() ip: string) {
    return this.service.criar(dto, req.user.userId, ip);
  }

  /** Lista consentimentos ativos com suas contas. */
  @Get()
  listar(@Req() req: AuthRequest) {
    return this.service.listar(req.user.userId);
  }

  /** Revoga consentimento e apaga dados locais. */
  @Delete(':id')
  @HttpCode(204)
  revogar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthRequest,
    @Ip() ip: string,
  ) {
    return this.service.revogar(id, req.user.userId, ip);
  }
}
