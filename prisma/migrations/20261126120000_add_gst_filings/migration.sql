CREATE TABLE "GstFiling" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "itcIgst" INTEGER NOT NULL DEFAULT 0,
    "itcCgst" INTEGER NOT NULL DEFAULT 0,
    "itcSgst" INTEGER NOT NULL DEFAULT 0,
    "paidIgst" INTEGER NOT NULL DEFAULT 0,
    "paidCgst" INTEGER NOT NULL DEFAULT 0,
    "paidSgst" INTEGER NOT NULL DEFAULT 0,
    "filedAt" TIMESTAMP(3),
    "reference" TEXT,
    "note" TEXT,
    "snapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GstFiling_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GstFiling_kind_period_key" ON "GstFiling"("kind", "period");
