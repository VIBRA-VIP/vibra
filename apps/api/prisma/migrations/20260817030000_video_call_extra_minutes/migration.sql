-- AlterTable
ALTER TABLE "video_calls"
  ADD COLUMN IF NOT EXISTS "extra_minutes" INTEGER NOT NULL DEFAULT 0;
