-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'POST_UNLOCK';

-- CreateTable
CREATE TABLE IF NOT EXISTS "post_unlocks" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "credits_paid" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_unlocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "post_unlocks_post_id_user_id_key" ON "post_unlocks"("post_id", "user_id");
CREATE INDEX IF NOT EXISTS "post_unlocks_user_id_created_at_idx" ON "post_unlocks"("user_id", "created_at");

ALTER TABLE "post_unlocks"
  DROP CONSTRAINT IF EXISTS "post_unlocks_post_id_fkey";
ALTER TABLE "post_unlocks"
  ADD CONSTRAINT "post_unlocks_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_unlocks"
  DROP CONSTRAINT IF EXISTS "post_unlocks_user_id_fkey";
ALTER TABLE "post_unlocks"
  ADD CONSTRAINT "post_unlocks_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
