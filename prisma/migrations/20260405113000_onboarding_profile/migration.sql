DO $$
BEGIN
  CREATE TYPE "Role" AS ENUM ('STUDENT', 'ALUMNI');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "clerkId" TEXT,
  ADD COLUMN IF NOT EXISTS "firstName" TEXT,
  ADD COLUMN IF NOT EXISTS "lastName" TEXT,
  ADD COLUMN IF NOT EXISTS "graduationYear" INTEGER,
  ADD COLUMN IF NOT EXISTS "role" "Role";

UPDATE "User"
SET "role" = 'STUDENT'
WHERE "role" IS NULL;

ALTER TABLE "User"
  ALTER COLUMN "role" SET NOT NULL;

ALTER TABLE "User"
  DROP COLUMN IF EXISTS "name";

CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkId_key" ON "User"("clerkId");

CREATE TABLE IF NOT EXISTS "Profile" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "domain" TEXT,
  "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "lookingFor" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "offering" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "company" TEXT,
  "roleTitle" TEXT,
  "openToConnect" BOOLEAN NOT NULL DEFAULT true,

  CONSTRAINT "Profile_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Profile_userId_key" UNIQUE ("userId"),
  CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
