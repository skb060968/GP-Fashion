CREATE TABLE "SoldOutProduct" (
    "slug" TEXT NOT NULL,
    "soldOutAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoldOutProduct_pkey" PRIMARY KEY ("slug")
);

CREATE TABLE "RestockRequest" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestockRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RestockRequest_slug_email_key" ON "RestockRequest"("slug", "email");

CREATE INDEX "RestockRequest_slug_idx" ON "RestockRequest"("slug");
