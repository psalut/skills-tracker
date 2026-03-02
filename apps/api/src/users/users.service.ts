import { ConflictException, Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import type { UserPublic } from './users.types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<UserPublic> {
    try {
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          password: hashedPassword,
        },
      });

      return this.toPublic(user);
    } catch (err: unknown) {
      if (this.isUniqueEmailError(err)) {
        throw new ConflictException('Email already exists');
      }
      throw err;
    }
  }

  private toPublic(user: User): UserPublic {
    // no usamos "delete" (mutación), devolvemos un objeto nuevo
    const { password: _password, ...rest } = user;
    return rest;
  }

  private isUniqueEmailError(err: unknown): boolean {
    if (typeof err !== 'object' || err === null) return false;
    const code = (err as { code?: unknown }).code;
    const meta = (err as { meta?: unknown }).meta;

    const isP2002 = code === 'P2002';
    if (!isP2002) return false;

    if (typeof meta === 'object' && meta !== null) {
      const target = (meta as { target?: unknown }).target;
      if (Array.isArray(target)) return target.includes('email');
    }
    return true;
  }
}