-- CreateTable
CREATE TABLE "admin_secrets" (
    "id" UUID NOT NULL,
    "key_hash" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'default',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_secrets_pkey" PRIMARY KEY ("id")
);
