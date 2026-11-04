import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CategoriaModule } from './categoria/categoria.module';
import { ConsentimentoModule } from './consentimento/consentimento.module';
import { ContaModule } from './conta/conta.module';
import { EncryptionModule } from './encryption/encryption.module';
import { PluggyModule } from './pluggy/pluggy.module';
import { PrismaModule } from './prisma/prisma.module';
import { TransacaoModule } from './transacao/transacao.module';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EncryptionModule,
    AuditModule,
    AuthModule,
    PluggyModule,
    ConsentimentoModule,
    ContaModule,
    WebhookModule,
    CategoriaModule,
    TransacaoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
