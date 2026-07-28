-- CreateEnum
CREATE TYPE "ProfileGender" AS ENUM ('FEMALE', 'MALE', 'OTHER');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "age" INTEGER NOT NULL DEFAULT 18,
ADD COLUMN     "attributes" JSONB,
ADD COLUMN     "gender" "ProfileGender" NOT NULL DEFAULT 'FEMALE',
ADD COLUMN     "services" JSONB;

-- CreateIndex
CREATE INDEX "profiles_gender_idx" ON "profiles"("gender");
