-- CreateTable
CREATE TABLE "sessao" (
    "id" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "refresh_hash" TEXT NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,
    "revogada" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sessao_refresh_hash_key" ON "sessao"("refresh_hash");

-- AddForeignKey
ALTER TABLE "sessao" ADD CONSTRAINT "sessao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
