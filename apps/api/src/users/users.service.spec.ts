import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  const prismaMock = {
    user: {
      create: jest.fn(),
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

  it('hashes password and creates a user (does not return password)', async () => {
    const hashMock = bcrypt.hash as unknown as jest.Mock;
    hashMock.mockResolvedValue('hashed_123');

    const created: User = {
      id: 'u1',
      email: 'pablo@mail.com',
      name: 'Pablo',
      password: 'hashed_123',
      createdAt: new Date('2026-03-02T20:00:00.000Z'),
      updatedAt: new Date('2026-03-02T20:00:00.000Z'),
    };

    prismaMock.user.create.mockResolvedValue(created);

    const result = await service.create({
      email: 'pablo@mail.com',
      name: 'Pablo',
      password: '123456',
    });

    expect(bcrypt.hash).toHaveBeenCalledTimes(1);
    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: 'pablo@mail.com',
        name: 'Pablo',
        password: 'hashed_123',
      },
    });

    // password no debe salir
    expect(result).toEqual({
      id: created.id,
      email: created.email,
      name: created.name,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
    expect((result as unknown as { password?: unknown }).password).toBeUndefined();
  });

  it('throws ConflictException on unique email (P2002)', async () => {
    (bcrypt.hash as unknown as jest.Mock).mockResolvedValue('hashed_123');

    prismaMock.user.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['email'] },
    });

    await expect(
      service.create({ email: 'dup@mail.com', password: '123456' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});