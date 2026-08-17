-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'PAYOUT';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PayoutRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'REJECTED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "payout_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "credits_gross" INTEGER NOT NULL,
    "fee_credits" INTEGER NOT NULL,
    "net_credits" INTEGER NOT NULL,
    "amount_cop" INTEGER NOT NULL,
    "fee_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "status" "PayoutRequestStatus" NOT NULL DEFAULT 'PENDING',
    "payout_bank_id" INTEGER NOT NULL,
    "payout_account_type" "PayoutAccountType" NOT NULL,
    "payout_account" TEXT NOT NULL,
    "payout_holder" TEXT NOT NULL,
    "scheduled_for" DATE NOT NULL,
    "paid_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "payout_requests_user_id_created_at_idx" ON "payout_requests"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "payout_requests_status_idx" ON "payout_requests"("status");
CREATE INDEX IF NOT EXISTS "payout_requests_scheduled_for_idx" ON "payout_requests"("scheduled_for");

ALTER TABLE "payout_requests"
  DROP CONSTRAINT IF EXISTS "payout_requests_user_id_fkey";
ALTER TABLE "payout_requests"
  ADD CONSTRAINT "payout_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
