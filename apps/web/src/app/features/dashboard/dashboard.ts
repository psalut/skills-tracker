import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SkillLevel, UserSkill } from '../skills/skill.model';
import { UserSkillsService } from '../user-skills/user-skills.service';

const SKILL_LEVEL_ORDER: Array<SkillLevel | null> = [
  null,
  'BEGINNER',
  'BASIC',
  'INTERMEDIATE',
  'UPPER_INTERMEDIATE',
  'ADVANCED',
  'EXPERT',
];
const MAX_SKILL_LEVEL: SkillLevel = 'EXPERT';

type DashboardListItem = {
  id: string;
  name: string;
  currentLabel: string;
  targetLabel: string;
  progress: number;
  gap: number;
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly userSkillsService = inject(UserSkillsService);

  readonly skills = signal<UserSkill[]>([]);
  readonly isLoading = signal(true);
  readonly loadErrorMessage = signal<string | null>(null);

  readonly stats = computed(() => {
    const skills = this.skills();

    return [
      { label: 'Tracked skills', value: skills.length.toString() },
      {
        label: 'In progress',
        value: skills
          .filter((skill) => this.isInProgress(skill))
          .length.toString(),
      },
      {
        label: 'Completed',
        value: skills
          .filter((skill) => this.isCompleted(skill))
          .length.toString(),
      },
      {
        label: 'Not started',
        value: skills
          .filter((skill) => skill.currentLevel === null)
          .length.toString(),
      },
    ];
  });

  readonly needsAttention = computed(() =>
    this.skills()
      .filter((skill) => this.isInProgress(skill))
      .map((skill) => this.toListItem(skill))
      .sort(
        (left, right) =>
          right.gap - left.gap ||
          left.progress - right.progress ||
          left.name.localeCompare(right.name),
      )
      .slice(0, 4),
  );

  readonly closestToTarget = computed(() =>
    this.skills()
      .filter((skill) => this.isInProgress(skill))
      .map((skill) => this.toListItem(skill))
      .sort(
        (left, right) =>
          left.gap - right.gap ||
          right.progress - left.progress ||
          left.name.localeCompare(right.name),
      )
      .slice(0, 4),
  );

  async ngOnInit(): Promise<void> {
    await this.loadUserSkills();
  }

  async retry(): Promise<void> {
    await this.loadUserSkills();
  }

  hasSkills(): boolean {
    return this.skills().length > 0;
  }

  trackByItem(_: number, item: DashboardListItem): string {
    return item.id;
  }

  private async loadUserSkills(): Promise<void> {
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);

    try {
      this.skills.set(await this.userSkillsService.getUserSkills());
    } catch {
      this.loadErrorMessage.set('Could not load your dashboard right now.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private toListItem(skill: UserSkill): DashboardListItem {
    const currentIndex = this.getLevelIndex(skill.currentLevel);
    const targetIndex = this.getLevelIndex(MAX_SKILL_LEVEL);

    return {
      id: skill.id,
      name: skill.skill.name,
      currentLabel: this.getLevelLabel(skill.currentLevel),
      targetLabel: this.getLevelLabel(MAX_SKILL_LEVEL),
      progress: this.getProgress(skill),
      gap: Math.max(targetIndex - currentIndex, 0),
    };
  }

  private isCompleted(skill: UserSkill): boolean {
    return (
      skill.currentLevel !== null && skill.currentLevel === MAX_SKILL_LEVEL
    );
  }

  private isInProgress(skill: UserSkill): boolean {
    return skill.currentLevel !== MAX_SKILL_LEVEL;
  }

  private getProgress(skill: UserSkill): number {
    const currentIndex = this.getLevelIndex(skill.currentLevel);
    const targetIndex = this.getLevelIndex(MAX_SKILL_LEVEL);

    if (targetIndex <= 0) {
      return 0;
    }

    return Math.min(Math.round((currentIndex / targetIndex) * 100), 100);
  }

  private getLevelIndex(level: SkillLevel | null): number {
    return Math.max(SKILL_LEVEL_ORDER.indexOf(level), 0);
  }

  private getLevelLabel(level: SkillLevel | null): string {
    return level ? level.replace('_', ' ').toLowerCase() : 'Not started';
  }
}
