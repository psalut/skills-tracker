/*
  Warnings:

  - You are about to drop the column `level` on the `Skill` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[parentSkillId,name]` on the table `Skill` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Skill_name_parentSkillId_key";

-- AlterTable
ALTER TABLE "Skill" DROP COLUMN "level";

-- CreateIndex
CREATE UNIQUE INDEX "Skill_parentSkillId_name_key" ON "Skill"("parentSkillId", "name");
