import { computed, Component, inject, OnInit, signal } from '@angular/core';
import { SkillLevel, UserSkill } from '../skills/skill.model';
import { UserSkillsService } from './user-skills.service';

const SKILL_LEVELS: Array<SkillLevel | null> = [
  null,
  'BEGINNER',
  'BASIC',
  'INTERMEDIATE',
  'UPPER_INTERMEDIATE',
  'ADVANCED',
  'EXPERT',
];
const MAX_SKILL_LEVEL: SkillLevel = 'EXPERT';

@Component({
  selector: 'app-user-skills',
  imports: [],
  templateUrl: './user-skills.html',
  styleUrl: './user-skills.scss',
})
export class UserSkills implements OnInit {
  private readonly userSkillsService = inject(UserSkillsService);

  readonly skills = signal<UserSkill[]>([]);
  readonly isLoading = signal(true);
  readonly loadErrorMessage = signal<string | null>(null);
  readonly updateErrorMessage = signal<string | null>(null);
  readonly updatingSkillIds = signal<string[]>([]);

  readonly stats = computed(() => {
    const skills = this.skills();

    return {
      total: skills.length,
      inProgress: skills.filter(
        (skill) =>
          skill.currentLevel !== null && skill.currentLevel !== MAX_SKILL_LEVEL,
      ).length,
      completed: skills.filter(
        (skill) => skill.currentLevel === MAX_SKILL_LEVEL,
      ).length,
    };
  });

  async ngOnInit(): Promise<void> {
    await this.loadUserSkills();
  }

  getLevelLabel(level: UserSkill['currentLevel']): string {
    return level ? level.replace('_', ' ').toLowerCase() : 'Not started';
  }

  isUpdating(skillId: string): boolean {
    return this.updatingSkillIds().includes(skillId);
  }

  canDecrease(skill: UserSkill): boolean {
    return (
      SKILL_LEVELS.indexOf(skill.currentLevel) > 0 && !this.isUpdating(skill.id)
    );
  }

  canIncrease(skill: UserSkill): boolean {
    return (
      SKILL_LEVELS.indexOf(skill.currentLevel) <
        SKILL_LEVELS.indexOf(MAX_SKILL_LEVEL) && !this.isUpdating(skill.id)
    );
  }

  getProgress(skill: UserSkill): number {
    const current = skill.currentLevel
      ? SKILL_LEVELS.indexOf(skill.currentLevel)
      : 0;
    const maxLevel = SKILL_LEVELS.indexOf(MAX_SKILL_LEVEL);

    if (maxLevel <= 0) {
      return 0;
    }

    return Math.min(Math.round((current / maxLevel) * 100), 100);
  }

  async decreaseProgress(skill: UserSkill): Promise<void> {
    await this.updateLevel(skill, -1);
  }

  async increaseProgress(skill: UserSkill): Promise<void> {
    await this.updateLevel(skill, 1);
  }

  private async loadUserSkills(): Promise<void> {
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);

    try {
      const skills = await this.userSkillsService.getUserSkills();
      this.skills.set(skills);
    } catch {
      this.loadErrorMessage.set('Could not load your skills right now.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async updateLevel(skill: UserSkill, delta: -1 | 1): Promise<void> {
    const currentIndex = SKILL_LEVELS.indexOf(skill.currentLevel);
    const nextIndex = currentIndex + delta;

    if (nextIndex < 0 || nextIndex >= SKILL_LEVELS.length) {
      return;
    }

    const nextLevel = SKILL_LEVELS[nextIndex];
    const previousLevel = skill.currentLevel;

    this.markSkillUpdating(skill.id, true);
    this.updateErrorMessage.set(null);
    this.patchSkill(skill.id, { currentLevel: nextLevel });

    try {
      const updatedSkill = await this.userSkillsService.updateUserSkill(
        skill.id,
        {
          currentLevel: nextLevel,
        },
      );
      this.replaceSkill(updatedSkill);
    } catch {
      this.patchSkill(skill.id, { currentLevel: previousLevel });
      this.loadErrorMessage.set(
        `Could not update ${skill.skill.name} right now.`,
      );
    } finally {
      this.markSkillUpdating(skill.id, false);
    }
  }

  private replaceSkill(updatedSkill: UserSkill): void {
    this.skills.update((skills) =>
      skills.map((skill) =>
        skill.id === updatedSkill.id ? updatedSkill : skill,
      ),
    );
  }

  private patchSkill(id: string, patch: Partial<UserSkill>): void {
    this.skills.update((skills) =>
      skills.map((skill) => (skill.id === id ? { ...skill, ...patch } : skill)),
    );
  }

  private markSkillUpdating(id: string, isUpdating: boolean): void {
    this.updatingSkillIds.update((ids) =>
      isUpdating ? [...ids, id] : ids.filter((currentId) => currentId !== id),
    );
  }
}
