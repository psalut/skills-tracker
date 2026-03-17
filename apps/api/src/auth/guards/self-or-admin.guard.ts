import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import type { AuthenticatedRequest } from '../auth.types';
import { SELF_OR_ADMIN_KEY } from '../decorators/self-or-admin.decorator';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const paramName = this.reflector.getAllAndOverride<string>(
      SELF_OR_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!paramName) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const resourceOwnerId = request.params[paramName];

    if (
      request.user.role === UserRole.ADMIN ||
      resourceOwnerId === request.user.sub
    ) {
      return true;
    }

    throw new ForbiddenException('You can only access your own profile');
  }
}
