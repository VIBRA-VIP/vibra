-- CreateEnum
CREATE TYPE "PayoutProvider" AS ENUM ('NEQUI', 'BANCOLOMBIA', 'DAVIVIENDA', 'BBVA', 'OTRO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "accepted_terms_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "profile_completed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN "message_price" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "profiles" ADD COLUMN "content_price" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "profiles" ADD COLUMN "accepts_encounters" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "profiles" ADD COLUMN "payout_provider" "PayoutProvider";
ALTER TABLE "profiles" ADD COLUMN "payout_account" TEXT;
ALTER TABLE "profiles" ADD COLUMN "payout_holder" TEXT;

-- CreateIndex
CREATE INDEX "profiles_profile_completed_idx" ON "profiles"("profile_completed");
