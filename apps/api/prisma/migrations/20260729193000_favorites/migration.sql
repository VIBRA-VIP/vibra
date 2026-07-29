-- CreateTable
CREATE TABLE "favorites" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "model_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorites_client_id_idx" ON "favorites"("client_id");

-- CreateIndex
CREATE INDEX "favorites_model_id_idx" ON "favorites"("model_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_client_id_model_id_key" ON "favorites"("client_id", "model_id");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
