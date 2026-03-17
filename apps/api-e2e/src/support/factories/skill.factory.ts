import { PrismaClient, SkillCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createTestSkill(overrides?: {
  name?: string;
  description?: string;
  category?: SkillCategory;
  parentSkillId?: string | null;
  isActive?: boolean;
}) {
  const name = overrides?.name ?? `Skill-${uniqueSuffix()}`;

  return prisma.skill.create({
    data: {
      name,
      description: overrides?.description ?? `${name} description`,
      category: overrides?.category ?? SkillCategory.BACKEND,
      parentSkillId: overrides?.parentSkillId ?? null,
      isActive: overrides?.isActive ?? true,
    },
  });
}

export async function disconnectSkillFactoryPrisma() {
  await prisma.$disconnect();
  await pool.end();
}
