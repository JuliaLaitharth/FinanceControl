-- AlterTable: adiciona unique constraint em instituicao.codigo_pluggy
CREATE UNIQUE INDEX IF NOT EXISTS "instituicao_codigo_pluggy_key" ON "instituicao"("codigo_pluggy");
