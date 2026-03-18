import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { SelfOrAdminGuard } from './self-or-admin.guard';

describe('SelfOrAdminGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  const guard = new SelfOrAdminGuard(reflector as unknown as Reflector);

  function createContext(
    role: UserRole,
    sub: string,
    params: Record<string, string>,
  ) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          params,
          user: {
            sub,
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

  it('allows access when no ownership metadata is configured', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(
      guard.canActivate(
        createContext(UserRole.USER, 'user-1', { id: 'user-2' }),
      ),
    ).toBe(true);
  });

  it('allows access to the resource owner', () => {
    reflector.getAllAndOverride.mockReturnValue('id');

    expect(
      guard.canActivate(
        createContext(UserRole.USER, 'user-1', { id: 'user-1' }),
      ),
    ).toBe(true);
  });

  it('allows access to admins', () => {
    reflector.getAllAndOverride.mockReturnValue('id');

    expect(
      guard.canActivate(
        createContext(UserRole.ADMIN, 'admin-1', { id: 'user-1' }),
      ),
    ).toBe(true);
  });

  it('throws ForbiddenException for another non-admin user', () => {
    reflector.getAllAndOverride.mockReturnValue('id');

    expect(() =>
      guard.canActivate(
        createContext(UserRole.USER, 'user-1', { id: 'user-2' }),
      ),
    ).toThrow(new ForbiddenException('You can only access your own profile'));
  });
});
