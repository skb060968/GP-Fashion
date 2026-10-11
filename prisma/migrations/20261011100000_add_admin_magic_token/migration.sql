ALTER TABLE "AdminLoginChallenge" ADD COLUMN "magicTokenHash" TEXT;

DELETE FROM "AdminLoginChallenge";

ALTER TABLE "AdminLoginChallenge" ALTER COLUMN "magicTokenHash" SET NOT NULL;

ALTER TABLE "AdminLoginChallenge" ADD CONSTRAINT "AdminLoginChallenge_magicTokenHash_check" CHECK (char_length("magicTokenHash") = 64);
