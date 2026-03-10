import { PrismaClient } from '@prisma/client';
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

export async function createTestUser(overrides?: {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}) {
  const suffix = uniqueSuffix();

  return prisma.user.create({
    data: {
      email: overrides?.email ?? `test-user-${suffix}@mail.com`,
      firstName: overrides?.firstName ?? 'Pablo',
      lastName: overrides?.lastName ?? 'Lopez',
      password: overrides?.password ?? 'hashed-password',
    },
  });
}

export async function disconnectUserFactoryPrisma() {
  await prisma.$disconnect();
  await pool.end();
}