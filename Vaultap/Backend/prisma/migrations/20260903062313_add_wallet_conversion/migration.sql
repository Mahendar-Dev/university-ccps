-- AlterTable
ALTER TABLE "coin_balances" ADD COLUMN     "usdt_balance" DECIMAL(20,6) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "conversions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "coin_amount" BIGINT NOT NULL,
    "usdt_amount" DECIMAL(20,6) NOT NULL,
    "fee_percent" DECIMAL(5,2) NOT NULL,
    "fee_amount" DECIMAL(20,6) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "to_wallet_address" TEXT NOT NULL,
    "usdt_amount" DECIMAL(20,6) NOT NULL,
    "fee_amount" DECIMAL(20,6) NOT NULL,
    "tx_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);
