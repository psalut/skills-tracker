import { AuthUser } from '../../core/auth/auth.model';
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export type SkillCategory =
  | 'FRONTEND'
  | 'BACKEND'
  | 'DEVOPS'
  | 'DATABASE'
  | 'TESTING'
  | 'SOFT_SKILL'
  | 'LANGUAGE'
  | 'TOOLING'
  | 'OTHER';

export interface Skill {
  id: string;
  name: string;
  description: string | null;
  category: SkillCategory;
  parentSkillId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  currentLevel: SkillLevel | null;
  targetLevel: SkillLevel | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user?: AuthUser;
  skill: Skill;
}

export interface UpdateUserSkillRequest {
  currentLevel?: SkillLevel | null;
  targetLevel?: SkillLevel | null;
  notes?: string | null;
}
