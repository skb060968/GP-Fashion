CREATE TABLE "AdminLoginChallenge" (
    "key" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminLoginChallenge_pkey" PRIMARY KEY ("key"),
    CONSTRAINT "AdminLoginChallenge_singleton_check" CHECK ("key" = 'admin'),
    CONSTRAINT "AdminLoginChallenge_attempts_check" CHECK ("attempts" BETWEEN 0 AND 5),
    CONSTRAINT "AdminLoginChallenge_codeHash_check" CHECK (char_length("codeHash") = 64)
);

CREATE UNIQUE INDEX "AdminLoginChallenge_challengeId_key" ON "AdminLoginChallenge"("challengeId");
