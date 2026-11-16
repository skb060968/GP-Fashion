CREATE TABLE "HiddenProduct" (
    "slug" TEXT NOT NULL,
    "hiddenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HiddenProduct_pkey" PRIMARY KEY ("slug")
);
