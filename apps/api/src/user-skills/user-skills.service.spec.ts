import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SkillLevel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UserSkillsService } from './user-skills.service';

describe('UserSkillsService', () => {
  let service: UserSkillsService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
    };
    skill: {
      findFirst: jest.Mock;
    };
    userSkill: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
      skill: {
        findFirst: jest.fn(),
      },
      userSkill: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSkillsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UserSkillsService>(UserSkillsService);
  });

  describe('create', () => {
    const userId = 'user-1';
    const skillId = 'skill-1';
    const createDto = {
      skillId,
      currentLevel: SkillLevel.BEGINNER,
      notes: 'Practicing every day.',
    };

    it('should create a user-skill relation', async () => {
      const user = { id: userId };
      const skill = { id: skillId, deletedAt: null };
      const createdUserSkill = {
        id: 'user-skill-1',
        userId,
        skillId,
        currentLevel: SkillLevel.BEGINNER,
        notes: 'Practicing every day.',
      };

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.skill.findFirst.mockResolvedValue(skill);
      prisma.userSkill.findUnique.mockResolvedValue(null);
      prisma.userSkill.create.mockResolvedValue(createdUserSkill);

      const result = await service.create(userId, createDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prisma.skill.findFirst).toHaveBeenCalledWith({
        where: {
          id: skillId,
          deletedAt: null,
        },
      });
      expect(prisma.userSkill.findUnique).toHaveBeenCalledWith({
        where: {
          userId_skillId: {
            userId,
            skillId,
          },
        },
      });
      expect(prisma.userSkill.create).toHaveBeenCalledWith({
        data: {
          userId,
          skillId,
          currentLevel: SkillLevel.BEGINNER,
          notes: 'Practicing every day.',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          skill: true,
        },
      });
      expect(result).toEqual(createdUserSkill);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        new NotFoundException(`User with id "${userId}" not found`),
      );

      expect(prisma.skill.findFirst).not.toHaveBeenCalled();
      expect(prisma.userSkill.findUnique).not.toHaveBeenCalled();
      expect(prisma.userSkill.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when skill does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.skill.findFirst.mockResolvedValue(null);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        new NotFoundException(`Active skill with id "${skillId}" not found`),
      );

      expect(prisma.userSkill.findUnique).not.toHaveBeenCalled();
      expect(prisma.userSkill.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when relation already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.skill.findFirst.mockResolvedValue({
        id: skillId,
        deletedAt: null,
      });
      prisma.userSkill.findUnique.mockResolvedValue({
        id: 'existing-user-skill',
      });

      await expect(service.create(userId, createDto)).rejects.toThrow(
        new ConflictException(
          `UserSkill already exists for user "${userId}" and skill "${skillId}"`,
        ),
      );

      expect(prisma.userSkill.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all user-skill relations for the given user', async () => {
      const userId = 'user-1';
      const userSkills = [
        { id: 'us-1', userId, skillId: 'skill-1' },
        { id: 'us-2', userId, skillId: 'skill-2' },
      ];

      prisma.userSkill.findMany.mockResolvedValue(userSkills);

      const result = await service.findAll(userId);

      expect(prisma.userSkill.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          skill: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(userSkills);
    });
  });

  describe('findOne', () => {
    it('should return a user-skill relation when it belongs to the user', async () => {
      const id = 'user-skill-1';
      const userId = 'user-1';
      const userSkill = { id, userId, skillId: 'skill-1' };

      prisma.userSkill.findFirst.mockResolvedValue(userSkill);

      const result = await service.findOne(id, userId);

      expect(prisma.userSkill.findFirst).toHaveBeenCalledWith({
        where: {
          id,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          skill: true,
        },
      });
      expect(result).toEqual(userSkill);
    });

    it('should throw NotFoundException when relation does not exist or does not belong to the user', async () => {
      const id = 'user-skill-1';
      const userId = 'user-1';

      prisma.userSkill.findFirst.mockResolvedValue(null);

      await expect(service.findOne(id, userId)).rejects.toThrow(
        new NotFoundException(`UserSkill with id "${id}" not found`),
      );
    });
  });

  describe('findByUser', () => {
    it('should return all skills for a user', async () => {
      const userId = 'user-1';
      const user = { id: userId };
      const userSkills = [
        { id: 'us-1', userId, skill: { id: 'skill-1', name: 'NestJS' } },
      ];

      prisma.user.findUnique.mockResolvedValue(user);
      prisma.userSkill.findMany.mockResolvedValue(userSkills);

      const result = await service.findByUser(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prisma.userSkill.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: {
          skill: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(userSkills);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const userId = 'user-1';

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findByUser(userId)).rejects.toThrow(
        new NotFoundException(`User with id "${userId}" not found`),
      );

      expect(prisma.userSkill.findMany).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a user-skill relation when it belongs to the user', async () => {
      const id = 'user-skill-1';
      const userId = 'user-1';
      const updateDto = {
        currentLevel: SkillLevel.ADVANCED,
        notes: 'Improved a lot',
      };
      const existingUserSkill = { id, userId, skillId: 'skill-1' };
      const updatedUserSkill = {
        id,
        userId,
        skillId: 'skill-1',
        ...updateDto,
      };

      prisma.userSkill.findFirst.mockResolvedValue(existingUserSkill);
      prisma.userSkill.update.mockResolvedValue(updatedUserSkill);

      const result = await service.update(id, userId, updateDto);

      expect(prisma.userSkill.findFirst).toHaveBeenCalledWith({
        where: {
          id,
          userId,
        },
      });
      expect(prisma.userSkill.update).toHaveBeenCalledWith({
        where: { id },
        data: updateDto,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          skill: true,
        },
      });
      expect(result).toEqual(updatedUserSkill);
    });

    it('should throw NotFoundException when relation does not exist or does not belong to the user', async () => {
      const id = 'user-skill-1';
      const userId = 'user-1';
      const updateDto = {
        currentLevel: SkillLevel.INTERMEDIATE,
      };

      prisma.userSkill.findFirst.mockResolvedValue(null);

      await expect(service.update(id, userId, updateDto)).rejects.toThrow(
        new NotFoundException(`UserSkill with id "${id}" not found`),
      );

      expect(prisma.userSkill.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a user-skill relation when it belongs to the user', async () => {
      const id = 'user-skill-1';
      const userId = 'user-1';

      prisma.userSkill.findFirst.mockResolvedValue({ id, userId });
      prisma.userSkill.delete.mockResolvedValue({ id });

      const result = await service.remove(id, userId);

      expect(prisma.userSkill.findFirst).toHaveBeenCalledWith({
        where: {
          id,
          userId,
        },
      });
      expect(prisma.userSkill.delete).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual({
        message: `UserSkill with id "${id}" deleted successfully`,
      });
    });

    it('should throw NotFoundException when relation does not exist or does not belong to the user', async () => {
      const id = 'user-skill-1';
      const userId = 'user-1';

      prisma.userSkill.findFirst.mockResolvedValue(null);

      await expect(service.remove(id, userId)).rejects.toThrow(
        new NotFoundException(`UserSkill with id "${id}" not found`),
      );

      expect(prisma.userSkill.delete).not.toHaveBeenCalled();
    });
  });
});
