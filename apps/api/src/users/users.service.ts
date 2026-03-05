import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import type { UserPublic } from './users.types';
import { Prisma } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

const UNIQUE_USER_FIELDS = ['email'] as const;
// cuando agregues username: ['email', 'username'] as const
type UniqueUserField = (typeof UNIQUE_USER_FIELDS)[number];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<UserPublic> {
    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          password: hashedPassword,
        },
      });

      return this.toPublic(user);
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const field = await this.resolveUniqueConflict({ email: dto.email });

        if (field === 'email') {
          throw new ConflictException('Email already exists');
        }
        throw new ConflictException('Unique constraint violation');
      }
      throw err;
    }
  }

  async findById(id: string): Promise<UserPublic> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.toPublic(user);
  }

  async findMany(): Promise<UserPublic[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.toPublic(u));
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserPublic> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: dto,
      });
      return this.toPublic(user);
    } catch (err: unknown) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const field = await this.resolveUniqueConflict(
          { email: dto.email },
          id,
        );

        if (field === 'email') {
          throw new ConflictException('Email already exists');
        }
        throw new ConflictException('Unique constraint violation');
      }

      if (this.isNotFoundError(err))
        throw new NotFoundException('User not found');
      throw err;
    }
  }

  private toPublic(user: User): UserPublic {
    // no usamos "delete" (mutación), devolvemos un objeto nuevo
    const { password: _password, ...rest } = user;
    return rest;
  }

  private async resolveUniqueConflict(
    data: Partial<Record<UniqueUserField, string>>,
    excludeId?: string,
  ): Promise<UniqueUserField | null> {
    for (const field of UNIQUE_USER_FIELDS) {
      const value = data[field];
      if (!value) continue;

      const existing = await this.prisma.user.findFirst({
        where: {
          [field]: value,
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
      });

      if (existing) return field;
    }
    return null;
  }

  private isNotFoundError(err: unknown): boolean {
    // Prisma: record to update not found => P2025
    if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
    return err.code === 'P2025';
  }
}
