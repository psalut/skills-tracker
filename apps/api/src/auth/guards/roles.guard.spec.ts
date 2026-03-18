import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  const guard = new RolesGuard(reflector as unknown as Reflector);

  function createContext(role: UserRole) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: {
            sub: 'user-1',
            email: 'user@mail.com',
            role,
          },
        }),
      }),
    } as never;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(guard.canActivate(createContext(UserRole.USER))).toBe(true);
  });

  it('allows access when the authenticated user has a required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(guard.canActivate(createContext(UserRole.ADMIN))).toBe(true);
  });

  it('throws ForbiddenException when the authenticated user lacks the required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);

    expect(() => guard.canActivate(createContext(UserRole.USER))).toThrow(
      new ForbiddenException('Insufficient permissions'),
    );
  });
});
