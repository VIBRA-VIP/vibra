-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "MediaType" ADD VALUE 'ID_DOCUMENT';

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "verification_status" "VerificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED';
ALTER TABLE "profiles" ADD COLUMN "id_document_url" TEXT;
ALTER TABLE "profiles" ADD COLUMN "verification_submitted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "profiles_verification_status_idx" ON "profiles"("verification_status");

-- Existing completed models become approved
UPDATE "profiles" p
SET "verification_status" = 'APPROVED',
    "is_verified" = true
FROM "users" u
WHERE p.user_id = u.id
  AND u.role = 'MODEL'
  AND p.profile_completed = true;
