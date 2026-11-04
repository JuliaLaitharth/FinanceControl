import { Body, Controller, Delete, Get, HttpCode, Ip, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { LgpdService } from '../lgpd/lgpd.service';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { BiometriaDto } from './dto/biometria.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

class FcmTokenDto {
  @IsString()
  token!: string;
}

class AlexaIdDto {
  @IsString()
  alexaUserId!: string;
}

interface AuthRequest {
  user: { userId: number; sessaoId: string };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly lgpd: LgpdService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto, @Ip() ip: string) {
    return this.auth.register(dto, ip);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.auth.login(dto, ip);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto);
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: ForgotPasswordDto, @Ip() ip: string) {
    return this.auth.forgotPassword(dto, ip);
  }

  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto, @Ip() ip: string) {
    return this.auth.resetPassword(dto, ip);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: AuthRequest, @Ip() ip: string) {
    await this.auth.logout(req.user.userId, req.user.sessaoId, ip);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('biometria')
  biometria(@Req() req: AuthRequest, @Body() dto: BiometriaDto, @Ip() ip: string) {
    return this.auth.alterarBiometria(req.user.userId, dto.ativa, ip);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthRequest) {
    return this.auth.me(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('fcm-token')
  @HttpCode(204)
  registrarFcmToken(@Req() req: AuthRequest, @Body() dto: FcmTokenDto) {
    return this.auth.registrarFcmToken(req.user.userId, dto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('alexa-id')
  @HttpCode(204)
  async vincularAlexaId(@Req() req: AuthRequest, @Body() dto: AlexaIdDto) {
    await this.auth.vincularAlexaId(req.user.userId, dto.alexaUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('conta')
  @HttpCode(204)
  async excluirConta(@Req() req: AuthRequest, @Ip() ip: string) {
    await this.lgpd.excluirConta(req.user.userId, ip);
  }
}