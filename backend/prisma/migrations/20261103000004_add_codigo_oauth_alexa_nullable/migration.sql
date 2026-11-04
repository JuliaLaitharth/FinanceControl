-- Make alexa_user_id nullable on vinculo_alexa
ALTER TABLE "vinculo_alexa" ALTER COLUMN "alexa_user_id" DROP NOT NULL;

-- Create codigo_oauth table
CREATE TABLE "codigo_oauth" (
  "id"          SERIAL NOT NULL,
  "codigo"      TEXT NOT NULL,
  "usuario_id"  INTEGER NOT NULL,
  "redirect_uri" TEXT NOT NULL,
  "expira_em"   TIMESTAMP(3) NOT NULL,
  "usado"       BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "codigo_oauth_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "codigo_oauth_codigo_key" ON "codigo_oauth"("codigo");

ALTER TABLE "codigo_oauth"
  ADD CONSTRAINT "codigo_oauth_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
