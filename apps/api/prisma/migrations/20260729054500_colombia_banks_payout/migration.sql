-- CreateEnum
CREATE TYPE "PayoutAccountType" AS ENUM ('AHORROS', 'CORRIENTE');

-- AlterTable: replace enum provider with bank id + account type
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "payout_bank_id" INTEGER;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "payout_account_type" "PayoutAccountType";

-- Drop old provider column/enum if present (from previous migration)
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "payout_provider";
DROP TYPE IF EXISTS "PayoutProvider";
