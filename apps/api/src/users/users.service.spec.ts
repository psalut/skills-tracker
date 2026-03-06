import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { User } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

function prismaKnownError(code: string, meta?: Record<string, unknown>) {
  // PrismaClientKnownRequestError constructor shape:
  // new Prisma.PrismaClientKnownRequestError(message, { code, clientVersion, meta })
  return new Prisma.PrismaClientKnownRequestError('Prisma error', {
    code,
    clientVersion: 'test',
    meta,
  });
}

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(), // usado por B2 resolveUniqueConflict
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
    it('hashes password and creates a user (does not return password)', async () => {
      const hashMock = bcrypt.hash as unknown as jest.Mock;
      hashMock.mockResolvedValue('hashed_123');

      const created: User = {
        id: 'u1',
        email: 'pablo@mail.com',
        firstName: 'Pablo',
        lastName: 'Salut',
        password: 'hashed_123',
        createdAt: new Date('2026-03-02T20:00:00.000Z'),
        updatedAt: new Date('2026-03-02T20:00:00.000Z'),
      };

      prismaMock.user.create.mockResolvedValue(created);

      const result = await service.create({
        email: 'pablo@mail.com',
        firstName: 'Pablo',
        lastName: 'Salut',
        password: '12345678',
      });

      expect(bcrypt.hash).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).toHaveBeenCalledWith('12345678', 10);

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'pablo@mail.com',
          firstName: 'Pablo',
          lastName: 'Salut',
          password: 'hashed_123',
        },
      });

      // password no debe salir
      expect(result).toEqual({
        id: created.id,
        email: created.email,
        firstName: created.firstName,
        lastName: created.lastName,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
      expect((result as { password?: unknown }).password).toBeUndefined();
    });

    it('throws ConflictException "Email already exists" on unique violation (P2002) when conflict field can be resolved (B2)', async () => {
      (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hashed_123');

      prismaMock.user.create.mockRejectedValue(
        prismaKnownError('P2002', { modelName: 'User' }),
      );

      // B2: resolveUniqueConflict -> prisma.user.findFirst({ where: { email } })
      prismaMock.user.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.create({
          email: 'dup@mail.com',
          password: '12345678',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toMatchObject({
        name: 'ConflictException',
        message: 'Email already exists',
      });

      expect(prismaMock.user.findFirst).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'dup@mail.com' },
        select: { id: true },
      });
    });

    it('throws ConflictException "Unique constraint violation" on P2002 when it cannot resolve which field conflicted (B2 fallback)', async () => {
      (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hashed_123');

      prismaMock.user.create.mockRejectedValue(
        prismaKnownError('P2002', { modelName: 'User' }),
      );

      // No encuentra conflicto por DB (raro, pero posible)
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          email: 'dup@mail.com',
          password: '12345678',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toMatchObject({
        name: 'ConflictException',
        message: 'Unique constraint violation',
      });
    });

    it('rethrows non-prisma errors (does not swallow unexpected errors)', async () => {
      (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hashed_123');

      prismaMock.user.create.mockRejectedValue(new Error('boom'));

      await expect(
        service.create({
          email: 'x@mail.com',
          password: '12345678',
          firstName: 'A',
          lastName: 'B',
        }),
      ).rejects.toThrow('boom');
    });
  });

  describe('findById', () => {
    it('returns user public when found', async () => {
      const found: User = {
        id: 'u1',
        email: 'a@mail.com',
        firstName: 'A',
        lastName: 'B',
        password: 'hashed',
        createdAt: new Date('2026-03-02T20:00:00.000Z'),
        updatedAt: new Date('2026-03-02T20:00:00.000Z'),
      };

      prismaMock.user.findUnique.mockResolvedValue(found);

      const result = await service.findById('u1');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'u1' },
      });
      expect((result as { password?: unknown }).password).toBeUndefined();
      expect(result.id).toBe('u1');
    });

    it('throws NotFoundException when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('returns full user when found', async () => {
      const found: User = {
        id: 'u1',
        email: 'a@mail.com',
        firstName: 'A',
        lastName: 'B',
        password: 'hashed',
        createdAt: new Date('2026-03-02T20:00:00.000Z'),
        updatedAt: new Date('2026-03-02T20:00:00.000Z'),
      };

      prismaMock.user.findUnique.mockResolvedValue(found);

      const result = await service.findByEmail('a@mail.com');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'a@mail.com' },
      });
      expect(result).toEqual(found);
    });

    it('returns null when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('missing@mail.com');

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'missing@mail.com' },
      });
      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('returns users public list ordered by createdAt desc', async () => {
      const u1: User = {
        id: 'u1',
        email: '1@mail.com',
        firstName: 'A',
        lastName: 'B',
        password: 'hashed1',
        createdAt: new Date('2026-03-03T20:00:00.000Z'),
        updatedAt: new Date('2026-03-03T20:00:00.000Z'),
      };

      const u2: User = {
        id: 'u2',
        email: '2@mail.com',
        firstName: 'C',
        lastName: 'D',
        password: 'hashed2',
        createdAt: new Date('2026-03-02T20:00:00.000Z'),
        updatedAt: new Date('2026-03-02T20:00:00.000Z'),
      };

      prismaMock.user.findMany.mockResolvedValue([u1, u2]);

      const result = await service.findMany();

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect((result[0] as { password?: unknown }).password).toBeUndefined();
      expect((result[1] as { password?: unknown }).password).toBeUndefined();
    });
  });

  describe('update', () => {
    it('throws BadRequestException when dto is empty', async () => {
      await expect(service.update('u1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('updates allowed fields and returns public user', async () => {
      const updated: User = {
        id: 'u1',
        email: 'new@mail.com',
        firstName: 'New',
        lastName: 'Name',
        password: 'hashed',
        createdAt: new Date('2026-03-02T20:00:00.000Z'),
        updatedAt: new Date('2026-03-04T20:00:00.000Z'),
      };

      prismaMock.user.update.mockResolvedValue(updated);

      const result = await service.update('u1', {
        email: 'new@mail.com',
        firstName: 'New',
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: {
          email: 'new@mail.com',
          firstName: 'New',
        },
      });

      expect((result as { password?: unknown }).password).toBeUndefined();
      expect(result.email).toBe('new@mail.com');
      expect(result.firstName).toBe('New');
    });

    it('throws NotFoundException on P2025 (record to update not found)', async () => {
      prismaMock.user.update.mockRejectedValue(prismaKnownError('P2025'));

      await expect(
        service.update('missing', { firstName: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ConflictException "Email already exists" on P2002 when conflict field can be resolved (B2)', async () => {
      prismaMock.user.update.mockRejectedValue(
        prismaKnownError('P2002', { modelName: 'User' }),
      );

      prismaMock.user.findFirst.mockResolvedValue({ id: 'other-user' });

      await expect(
        service.update('u1', { email: 'dup@mail.com' }),
      ).rejects.toMatchObject({
        name: 'ConflictException',
        message: 'Email already exists',
      });

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: {
          email: 'dup@mail.com',
          id: { not: 'u1' },
        },
        select: { id: true },
      });
    });

    it('throws ConflictException "Unique constraint violation" on P2002 when cannot resolve conflict field (B2 fallback)', async () => {
      prismaMock.user.update.mockRejectedValue(
        prismaKnownError('P2002', { modelName: 'User' }),
      );
      prismaMock.user.findFirst.mockResolvedValue(null);

      await expect(
        service.update('u1', { email: 'dup@mail.com' }),
      ).rejects.toMatchObject({
        name: 'ConflictException',
        message: 'Unique constraint violation',
      });
    });
  });
});
