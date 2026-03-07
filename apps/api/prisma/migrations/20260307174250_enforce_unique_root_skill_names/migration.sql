-- Drop the Prisma generated unique constraint if it exists
ALTER TABLE "Skill"
DROP CONSTRAINT IF EXISTS "Skill_name_parentSkillId_key";

-- Drop index if it exists (important for shadow database)
DROP INDEX IF EXISTS "Skill_name_parentSkillId_key";

-- Create the correct unique index treating NULLs as equal
CREATE UNIQUE INDEX "Skill_name_parentSkillId_key"
ON "Skill" ("name", "parentSkillId") NULLS NOT DISTINCT;