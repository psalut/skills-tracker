import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserSkillDto } from './dto/create-user-skill.dto';
import { UpdateUserSkillDto } from './dto/update-user-skill.dto';

@Injectable()
export class UserSkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserSkillDto: CreateUserSkillDto) {
    const { userId, skillId, currentLevel, targetLevel, notes } = createUserSkillDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    const skill = await this.prisma.skill.findFirst({
      where: {
        id: skillId,
        deletedAt: null,
      },
    });

    if (!skill) {
      throw new NotFoundException(`Active skill with id "${skillId}" not found`);
    }

    const existingUserSkill = await this.prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
    });

    if (existingUserSkill) {
      throw new ConflictException(
        `UserSkill already exists for user "${userId}" and skill "${skillId}"`,
      );
    }

    return this.prisma.userSkill.create({
      data: {
        userId,
        skillId,
        currentLevel,
        targetLevel,
        notes,
      },
      include: {
        user: true,
        skill: true,
      },
    });
  }

  async findAll() {
    return this.prisma.userSkill.findMany({
      include: {
        user: true,
        skill: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const userSkill = await this.prisma.userSkill.findUnique({
      where: { id },
      include: {
        user: true,
        skill: true,
      },
    });

    if (!userSkill) {
      throw new NotFoundException(`UserSkill with id "${id}" not found`);
    }

    return userSkill;
  }

  async findByUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    return this.prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(id: string, updateUserSkillDto: UpdateUserSkillDto) {
    const existingUserSkill = await this.prisma.userSkill.findUnique({
      where: { id },
    });

    if (!existingUserSkill) {
      throw new NotFoundException(`UserSkill with id "${id}" not found`);
    }

    return this.prisma.userSkill.update({
      where: { id },
      data: updateUserSkillDto,
      include: {
        user: true,
        skill: true,
      },
    });
  }

  async remove(id: string) {
    const existingUserSkill = await this.prisma.userSkill.findUnique({
      where: { id },
    });

    if (!existingUserSkill) {
      throw new NotFoundException(`UserSkill with id "${id}" not found`);
    }

    await this.prisma.userSkill.delete({
      where: { id },
    });

    return {
      message: `UserSkill with id "${id}" deleted successfully`,
    };
  }
}