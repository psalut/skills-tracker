import type { User } from '@prisma/client';

export type UserPublic = Omit<User, 'password'>;