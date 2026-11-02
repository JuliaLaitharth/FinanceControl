-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "biometria_ativa" BOOLEAN NOT NULL DEFAULT false,
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_login" TIMESTAMP(3),
    "tentativas_falhas" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_ate" TIMESTAMP(3),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_recuperacao" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "token_recuperacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vinculo_alexa" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "alexa_user_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_vinculo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vinculo_alexa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instituicao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo_pluggy" TEXT NOT NULL,
    "logo_url" TEXT,

    CONSTRAINT "instituicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentimento" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "instituicao_id" INTEGER NOT NULL,
    "item_id_pluggy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "data_consentimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_expiracao" TIMESTAMP(3),
    "data_revogacao" TIMESTAMP(3),

    CONSTRAINT "consentimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conta_bancaria" (
    "id" SERIAL NOT NULL,
    "consentimento_id" INTEGER NOT NULL,
    "id_externo_pluggy" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero_mascarado" TEXT,
    "saldo_atual" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "moeda" TEXT NOT NULL DEFAULT 'BRL',
    "ultima_sincronizacao" TIMESTAMP(3),

    CONSTRAINT "conta_bancaria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "icone" TEXT,
    "padrao_sistema" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacao" (
    "id" SERIAL NOT NULL,
    "conta_id" INTEGER NOT NULL,
    "categoria_id" INTEGER,
    "id_externo_pluggy" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "metodo_pagamento" TEXT,
    "categoria_ajustada_manualmente" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "transacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regra_alerta" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "tipo_evento" TEXT NOT NULL,
    "operador" TEXT,
    "valor_limite" DECIMAL(15,2),
    "categoria_id" INTEGER,
    "canal" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regra_alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "id" SERIAL NOT NULL,
    "regra_id" INTEGER NOT NULL,
    "transacao_id" INTEGER,
    "mensagem" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "status_envio" TEXT NOT NULL,
    "data_envio" TIMESTAMP(3),
    "lida" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_auditoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "acao" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "ip" TEXT,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "token_recuperacao_token_key" ON "token_recuperacao"("token");

-- CreateIndex
CREATE UNIQUE INDEX "conta_bancaria_id_externo_pluggy_key" ON "conta_bancaria"("id_externo_pluggy");

-- CreateIndex
CREATE UNIQUE INDEX "transacao_id_externo_pluggy_key" ON "transacao"("id_externo_pluggy");

-- CreateIndex
CREATE INDEX "transacao_conta_id_data_idx" ON "transacao"("conta_id", "data");

-- CreateIndex
CREATE UNIQUE INDEX "notificacao_regra_id_transacao_id_key" ON "notificacao"("regra_id", "transacao_id");

-- AddForeignKey
ALTER TABLE "token_recuperacao" ADD CONSTRAINT "token_recuperacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculo_alexa" ADD CONSTRAINT "vinculo_alexa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimento" ADD CONSTRAINT "consentimento_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimento" ADD CONSTRAINT "consentimento_instituicao_id_fkey" FOREIGN KEY ("instituicao_id") REFERENCES "instituicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conta_bancaria" ADD CONSTRAINT "conta_bancaria_consentimento_id_fkey" FOREIGN KEY ("consentimento_id") REFERENCES "consentimento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria" ADD CONSTRAINT "categoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao" ADD CONSTRAINT "transacao_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "conta_bancaria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao" ADD CONSTRAINT "transacao_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regra_alerta" ADD CONSTRAINT "regra_alerta_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regra_alerta" ADD CONSTRAINT "regra_alerta_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_regra_id_fkey" FOREIGN KEY ("regra_id") REFERENCES "regra_alerta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_transacao_id_fkey" FOREIGN KEY ("transacao_id") REFERENCES "transacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_auditoria" ADD CONSTRAINT "log_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
