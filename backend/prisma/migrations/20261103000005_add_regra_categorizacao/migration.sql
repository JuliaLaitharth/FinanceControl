CREATE TABLE "regra_categorizacao" (
  "id"           SERIAL NOT NULL,
  "usuario_id"   INTEGER NOT NULL,
  "palavra"      TEXT NOT NULL,
  "categoria_id" INTEGER NOT NULL,
  CONSTRAINT "regra_categorizacao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "regra_categorizacao_usuario_id_palavra_key"
  ON "regra_categorizacao"("usuario_id", "palavra");

ALTER TABLE "regra_categorizacao"
  ADD CONSTRAINT "regra_categorizacao_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "regra_categorizacao"
  ADD CONSTRAINT "regra_categorizacao_categoria_id_fkey"
  FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
