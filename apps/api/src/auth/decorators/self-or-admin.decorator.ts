import { SetMetadata } from '@nestjs/common';

export const SELF_OR_ADMIN_KEY = 'self_or_admin';

export const SelfOrAdmin = (paramName: string) =>
  SetMetadata(SELF_OR_ADMIN_KEY, paramName);
