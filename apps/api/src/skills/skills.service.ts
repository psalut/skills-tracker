import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSkillDto: CreateSkillDto) {
    const { parentSkillId, ...data } = createSkillDto;

    const deletedSkill = await this.prisma.skill.findFirst({
      where: {
        name: data.name,
        parentSkillId: parentSkillId ?? null,
        deletedAt: {
          not: null,
        },
      },
    });

    if (deletedSkill) {
      throw new BadRequestException({
        error: 'DELETED_SKILL_EXISTS',
        message:
          'A deleted skill with this name already exists at the same level. Restore it instead.',
        deletedSkillId: deletedSkill.id,
      });
    }

    if (parentSkillId) {
      const parentSkill = await this.prisma.skill.findFirst({
        where: {
          id: parentSkillId,
          deletedAt: null,
        },
      });

      if (!parentSkill) {
        throw new NotFoundException('Parent skill not found');
      }
    }

    try {
      return await this.prisma.skill.create({
        data: {
          ...data,
          parentSkillId: parentSkillId ?? null,
        },
        include: {
          parentSkill: true,
          subSkills: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll() {
    return this.prisma.skill.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        parentSkill: true,
        subSkills: {
          where: {
            deletedAt: null,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findRoots() {
    return this.prisma.skill.findMany({
      where: {
        parentSkillId: null,
        deletedAt: null,
      },
      include: {
        subSkills: {
          where: {
            deletedAt: null,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const skill = await this.prisma.skill.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        parentSkill: true,
        subSkills: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return skill;
  }

  async update(id: string, updateSkillDto: UpdateSkillDto) {
    await this.ensureSkillExists(id);

    const { parentSkillId, ...data } = updateSkillDto;

    if (parentSkillId !== undefined) {
      if (parentSkillId === id) {
        throw new BadRequestException('A skill cannot be its own parent');
      }

      if (parentSkillId !== null) {
        const parentSkill = await this.prisma.skill.findFirst({
          where: {
            id: parentSkillId,
            deletedAt: null,
          },
        });

        if (!parentSkill) {
          throw new NotFoundException('Parent skill not found');
        }

        await this.ensureNoCircularRelation(id, parentSkillId);
      }
    }

    try {
      return await this.prisma.skill.update({
        where: { id },
        data: {
          ...data,
          ...(parentSkillId !== undefined ? { parentSkillId } : {}),
        },
        include: {
          parentSkill: true,
          subSkills: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await this.ensureSkillExists(id);

    const childrenCount = await this.prisma.skill.count({
      where: {
        parentSkillId: id,
        deletedAt: null,
      },
    });

    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete a skill that has sub-skills',
      );
    }

    return this.prisma.skill.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async restore(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
    });

    if (!skill || skill.deletedAt === null) {
      throw new NotFoundException('Skill not found');
    }

    if (skill.parentSkillId) {
      const parentSkill = await this.prisma.skill.findFirst({
        where: {
          id: skill.parentSkillId,
          deletedAt: null,
        },
      });

      if (!parentSkill) {
        throw new BadRequestException(
          'Cannot restore a skill whose parent does not exist or is deleted',
        );
      }
    }

    try {
      return await this.prisma.skill.update({
        where: { id },
        data: {
          deletedAt: null,
        },
        include: {
          parentSkill: true,
          subSkills: {
            where: {
              deletedAt: null,
            },
          },
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private async ensureSkillExists(id: string) {
    const skill = await this.prisma.skill.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return skill;
  }

  private async ensureNoCircularRelation(
    skillId: string,
    newParentSkillId: string,
  ) {
    let currentParentId: string | null = newParentSkillId;

    while (currentParentId) {
      if (currentParentId === skillId) {
        throw new BadRequestException(
          'Circular parent-child relationship is not allowed',
        );
      }

      const currentParent = await this.prisma.skill.findUnique({
        where: { id: currentParentId },
        select: { parentSkillId: true, deletedAt: true },
      });

      if (!currentParent || currentParent.deletedAt !== null) {
        break;
      }

      currentParentId = currentParent.parentSkillId ?? null;
    }
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new BadRequestException(
        'A skill with this name already exists at the same level',
      );
    }

    throw error;
  }
}
