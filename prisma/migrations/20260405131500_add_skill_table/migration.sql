CREATE TABLE IF NOT EXISTS "Skill" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Skill_name_key" ON "Skill"("name");

INSERT INTO "Skill" ("name")
SELECT DISTINCT TRIM(s) AS "name"
FROM "Profile", unnest("skills") AS s
WHERE TRIM(s) <> ''
ON CONFLICT ("name") DO NOTHING;
