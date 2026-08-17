-- CreateEnum
CREATE TYPE "CreditPurchaseStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "credit_purchases" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "package_id" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amount_cop" INTEGER NOT NULL,
    "status" "CreditPurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT NOT NULL,
    "bold_payment_link" TEXT,
    "bold_payment_url" TEXT,
    "bold_transaction_id" TEXT,
    "webhook_event_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_purchases_reference_key" ON "credit_purchases"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "credit_purchases_webhook_event_id_key" ON "credit_purchases"("webhook_event_id");

-- CreateIndex
CREATE INDEX "credit_purchases_user_id_created_at_idx" ON "credit_purchases"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "credit_purchases_status_idx" ON "credit_purchases"("status");

-- CreateIndex
CREATE INDEX "credit_purchases_bold_payment_link_idx" ON "credit_purchases"("bold_payment_link");

-- AddForeignKey
ALTER TABLE "credit_purchases" ADD CONSTRAINT "credit_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
