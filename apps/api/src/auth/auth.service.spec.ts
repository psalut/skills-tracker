import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import type { UserPublic } from '../users/users.types';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('delegates user creation to UsersService.create and returns public user', async () => {
      const dto = {
        email: 'pablo@mail.com',
        password: '12345678',
        firstName: 'Pablo',
        lastName: 'Salut',
      };

      const createdUser: UserPublic = {
        id: 'u1',
        email: 'pablo@mail.com',
        firstName: 'Pablo',
        lastName: 'Salut',
        createdAt: new Date('2026-03-06T20:00:00.000Z'),
        updatedAt: new Date('2026-03-06T20:00:00.000Z'),
      };

      usersServiceMock.create.mockResolvedValue(createdUser);

      const result = await service.register(dto);

      expect(usersServiceMock.create).toHaveBeenCalledTimes(1);
      expect(usersServiceMock.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(createdUser);
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when user does not exist', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'missing@mail.com',
          password: '12345678',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(usersServiceMock.findByEmail).toHaveBeenCalledTimes(1);
      expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
        'missing@mail.com',
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password is invalid', async () => {
      const foundUser: User = {
        id: 'u1',
        email: 'pablo@mail.com',
        firstName: 'Pablo',
        lastName: 'Salut',
        password: 'hashed_password',
        createdAt: new Date('2026-03-06T20:00:00.000Z'),
        updatedAt: new Date('2026-03-06T20:00:00.000Z'),
      };

      usersServiceMock.findByEmail.mockResolvedValue(foundUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'pablo@mail.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
        'pablo@mail.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrong-password',
        'hashed_password',
      );
      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it('returns access token when credentials are valid', async () => {
      const foundUser: User = {
        id: 'u1',
        email: 'pablo@mail.com',
        firstName: 'Pablo',
        lastName: 'Salut',
        password: 'hashed_password',
        createdAt: new Date('2026-03-06T20:00:00.000Z'),
        updatedAt: new Date('2026-03-06T20:00:00.000Z'),
      };

      usersServiceMock.findByEmail.mockResolvedValue(foundUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtServiceMock.signAsync.mockResolvedValue('jwt_token_123');

      const result = await service.login({
        email: 'pablo@mail.com',
        password: '12345678',
      });

      expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
        'pablo@mail.com',
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        '12345678',
        'hashed_password',
      );
      expect(jwtServiceMock.signAsync).toHaveBeenCalledTimes(1);
      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'pablo@mail.com',
      });

      expect(result).toEqual({
        accessToken: 'jwt_token_123',
      });
    });
  });

  describe('me', () => {
    it('returns current user by id', async () => {
      const currentUser: UserPublic = {
        id: 'u1',
        email: 'pablo@mail.com',
        firstName: 'Pablo',
        lastName: 'Salut',
        createdAt: new Date('2026-03-06T20:00:00.000Z'),
        updatedAt: new Date('2026-03-06T20:00:00.000Z'),
      };

      usersServiceMock.findById.mockResolvedValue(currentUser);

      const result = await service.me('u1');

      expect(usersServiceMock.findById).toHaveBeenCalledTimes(1);
      expect(usersServiceMock.findById).toHaveBeenCalledWith('u1');
      expect(result).toEqual(currentUser);
    });
  });
});
