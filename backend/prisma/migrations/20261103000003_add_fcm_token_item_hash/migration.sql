-- AlterTable: adiciona fcm_token ao usuario
ALTER TABLE "usuario" ADD COLUMN IF NOT EXISTS "fcm_token" TEXT;

-- AlterTable: adiciona item_id_hash ao consentimento (para lookup rápido no webhook)
ALTER TABLE "consentimento" ADD COLUMN IF NOT EXISTS "item_id_hash" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "consentimento_item_id_hash_key" ON "consentimento"("item_id_hash");
