import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
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
  role?: UserRole;
}) {
  const suffix = uniqueSuffix();
  const password = overrides?.password ?? '12345678';
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email: overrides?.email ?? `test-user-${suffix}@mail.com`,
      firstName: overrides?.firstName ?? 'Pablo',
      lastName: overrides?.lastName ?? 'Lopez',
      password: hashedPassword,
      role: overrides?.role ?? UserRole.USER,
    },
  });
}

export async function disconnectUserFactoryPrisma() {
  await prisma.$disconnect();
  await pool.end();
}
