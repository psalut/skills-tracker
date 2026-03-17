ALTER TYPE "SkillLevel" RENAME TO "SkillLevel_old";

CREATE TYPE "SkillLevel" AS ENUM (
    'BEGINNER',
    'BASIC',
    'INTERMEDIATE',
    'UPPER_INTERMEDIATE',
    'ADVANCED',
    'EXPERT'
);

ALTER TABLE "UserSkill"
    ALTER COLUMN "currentLevel" TYPE "SkillLevel"
    USING ("currentLevel"::text::"SkillLevel");

ALTER TABLE "UserSkill"
    DROP COLUMN "targetLevel";

DROP TYPE "SkillLevel_old";
