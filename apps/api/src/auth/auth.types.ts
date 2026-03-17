import type { UserRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type AuthenticatedUser = JwtPayload;

export type AuthenticatedRequest = Request & {
  params: Record<string, string>;
  user: AuthenticatedUser;
};
