import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CategoriaService } from './categoria.service.js';

@Controller('categorias')
@UseGuards(JwtAuthGuard)
export class CategoriaController {
  constructor(private readonly service: CategoriaService) {}

  @Get()
  listar(@Request() req: { user: { sub: number } }) {
    return this.service.listar(req.user.sub);
  }
}
