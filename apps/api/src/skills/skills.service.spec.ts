import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma, SkillCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SkillsService } from './skills.service';

describe('SkillsService', () => {
  let service: SkillsService;
  let prismaService: {
    skill: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
  };

  const skill = {
    id: 'skill-1',
    name: 'NestJS',
    description: 'Framework',
    category: SkillCategory.BACKEND,
    parentSkillId: null,
    isActive: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaService = {
      skill: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    service = new SkillsService(prismaService as unknown as PrismaService);
  });

  describe('create', () => {
    it('should create a root skill', async () => {
      prismaService.skill.findFirst.mockResolvedValueOnce(null); // deletedSkill lookup
      prismaService.skill.create.mockResolvedValueOnce(skill);

      const result = await service.create({
        name: 'NestJS',
        description: 'Framework',
      });

      expect(prismaService.skill.create).toHaveBeenCalledWith({
        data: {
          name: 'NestJS',
          description: 'Framework',
          parentSkillId: null,
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
      expect(result).toEqual(skill);
    });

    it('should create a sub-skill if parent exists', async () => {
      prismaService.skill.findFirst
        .mockResolvedValueOnce(null) // deletedSkill lookup
        .mockResolvedValueOnce(skill); // parentSkill lookup

      prismaService.skill.create.mockResolvedValueOnce({
        ...skill,
        id: 'skill-2',
        name: 'Guards',
        parentSkillId: 'skill-1',
      });

      const result = await service.create({
        name: 'Guards',
        parentSkillId: 'skill-1',
      });

      expect(result.parentSkillId).toBe('skill-1');
    });

    it('should throw NotFoundException if parent skill does not exist', async () => {
      prismaService.skill.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.create({
          name: 'Guards',
          parentSkillId: 'missing-parent',
        }),
      ).rejects.toThrow(new NotFoundException('Parent skill not found'));
    });

    it('should throw BadRequestException if a deleted skill with same name already exists', async () => {
      prismaService.skill.findFirst.mockResolvedValueOnce({
        ...skill,
        id: 'deleted-skill-id',
        deletedAt: new Date(),
      });

      const promise = service.create({
        name: 'NestJS',
      });

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toMatchObject({
        response: {
          error: 'DELETED_SKILL_EXISTS',
          message:
            'A deleted skill with this name already exists at the same level. Restore it instead.',
          deletedSkillId: 'deleted-skill-id',
        },
      });
    });

    it('should map Prisma P2002 to BadRequestException', async () => {
      prismaService.skill.findFirst.mockResolvedValueOnce(null);

      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: 'test',
        },
      );

      prismaService.skill.create.mockRejectedValueOnce(prismaError);

      await expect(
        service.create({
          name: 'NestJS',
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'A skill with this name already exists at the same level',
        ),
      );
    });
  });

  describe('findAll', () => {
    it('should return non-deleted skills', async () => {
      prismaService.skill.findMany.mockResolvedValueOnce([skill]);

      const result = await service.findAll();

      expect(prismaService.skill.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual([skill]);
    });
  });

  describe('findRoots', () => {
    it('should return only root non-deleted skills', async () => {
      prismaService.skill.findMany.mockResolvedValueOnce([skill]);

      const result = await service.findRoots();

      expect(prismaService.skill.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual([skill]);
    });
  });

  describe('findOne', () => {
    it('should return a skill by id', async () => {
      prismaService.skill.findFirst.mockResolvedValueOnce(skill);

      const result = await service.findOne('skill-1');

      expect(result).toEqual(skill);
    });

    it('should throw NotFoundException if skill does not exist', async () => {
      prismaService.skill.findFirst.mockResolvedValueOnce(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        new NotFoundException('Skill not found'),
      );
    });
  });

  describe('update', () => {
    it('should update a skill', async () => {
      prismaService.skill.findFirst.mockResolvedValueOnce(skill); // ensureSkillExists
      prismaService.skill.update.mockResolvedValueOnce({
        ...skill,
        description: 'Updated description',
      });

      const result = await service.update('skill-1', {
        description: 'Updated description',
      });

      expect(prismaService.skill.update).toHaveBeenCalledWith({
        where: { id: 'skill-1' },
        data: {
          description: 'Updated description',
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
      expect(result.description).toBe('Updated description');
    });

    it('should throw BadRequestException if skill is its own parent', async () => {
      prismaService.skill.findFirst.mockResolvedValueOnce(skill); // ensureSkillExists

      await expect(
        service.update('skill-1', {
          parentSkillId: 'skill-1',
        }),
      ).rejects.toThrow(
        new BadRequestException('A skill cannot be its own parent'),
      );
    });

    it('should throw NotFoundException if new parent does not exist', async () => {
      prismaService.skill.findFirst
        .mockResolvedValueOnce(skill) // ensureSkillExists
        .mockResolvedValueOnce(null); // parentSkill lookup

      await expect(
        service.update('skill-1', {
          parentSkillId: 'missing-parent',
        }),
      ).rejects.toThrow(new NotFoundException('Parent skill not found'));
    });

    it('should throw BadRequestException on circular relation', async () => {
      prismaService.skill.findFirst
        .mockResolvedValueOnce(skill) // ensureSkillExists
        .mockResolvedValueOnce({ ...skill, id: 'skill-2' }); // parentSkill exists

      prismaService.skill.findUnique.mockResolvedValueOnce({
        parentSkillId: 'skill-1',
        deletedAt: null,
      });

      await expect(
        service.update('skill-1', {
          parentSkillId: 'skill-2',
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'Circular parent-child relationship is not allowed',
        ),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a skill if it has no sub-skills', async () => {
      prismaService.skill.findFirst.mockResolvedValueOnce(skill); // ensureSkillExists
      prismaService.skill.count.mockResolvedValueOnce(0);
      prismaService.skill.update.mockResolvedValueOnce({
        ...skill,
        deletedAt: new Date(),
      });

      const result = await service.remove('skill-1');

      expect(prismaService.skill.update).toHaveBeenCalledWith({
        where: { id: 'skill-1' },
        data: {
          deletedAt: expect.any(Date),
        },
      });
      expect(result.deletedAt).toEqual(expect.any(Date));
    });

    it('should throw BadRequestException if skill has sub-skills', async () => {
      prismaService.skill.findFirst.mockResolvedValueOnce(skill); // ensureSkillExists
      prismaService.skill.count.mockResolvedValueOnce(2);

      await expect(service.remove('skill-1')).rejects.toThrow(
        new BadRequestException('Cannot delete a skill that has sub-skills'),
      );
    });
  });

  describe('restore', () => {
    it('should restore a deleted root skill', async () => {
      prismaService.skill.findUnique.mockResolvedValueOnce({
        ...skill,
        deletedAt: new Date(),
      });

      prismaService.skill.update.mockResolvedValueOnce({
        ...skill,
        deletedAt: null,
      });

      const result = await service.restore('skill-1');

      expect(prismaService.skill.update).toHaveBeenCalledWith({
        where: { id: 'skill-1' },
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
      expect(result.deletedAt).toBeNull();
    });

    it('should throw NotFoundException if skill does not exist or is not deleted', async () => {
      prismaService.skill.findUnique.mockResolvedValueOnce({
        ...skill,
        deletedAt: null,
      });

      await expect(service.restore('skill-1')).rejects.toThrow(
        new NotFoundException('Skill not found'),
      );
    });

    it('should throw BadRequestException if parent is deleted or missing', async () => {
      prismaService.skill.findUnique.mockResolvedValueOnce({
        ...skill,
        deletedAt: new Date(),
        parentSkillId: 'parent-1',
      });

      prismaService.skill.findFirst.mockResolvedValueOnce(null);

      await expect(service.restore('skill-1')).rejects.toThrow(
        new BadRequestException(
          'Cannot restore a skill whose parent does not exist or is deleted',
        ),
      );
    });

    it('should restore a deleted child skill if parent exists', async () => {
      prismaService.skill.findUnique.mockResolvedValueOnce({
        ...skill,
        id: 'child-1',
        deletedAt: new Date(),
        parentSkillId: 'parent-1',
      });

      prismaService.skill.findFirst.mockResolvedValueOnce({
        ...skill,
        id: 'parent-1',
        deletedAt: null,
      });

      prismaService.skill.update.mockResolvedValueOnce({
        ...skill,
        id: 'child-1',
        deletedAt: null,
        parentSkillId: 'parent-1',
      });

      const result = await service.restore('child-1');

      expect(result.id).toBe('child-1');
      expect(result.deletedAt).toBeNull();
    });
  });
});
