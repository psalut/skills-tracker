import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SkillFormComponent } from './components/skill-form.component';
import {
  CreateSkillRequest,
  CreateUserSkillRequest,
  Skill,
  SkillCategory,
  UpdateSkillRequest,
} from './skill.model';
import { SkillsService } from './skills.service';
import { UserSkillsService } from '../user-skills/user-skills.service';

type SkillFormPayload = {
  name: string;
  description?: string;
  category: SkillCategory;
  isActive: boolean;
  parentSkillId?: string | null;
};

@Component({
  selector: 'app-skills',
  imports: [CommonModule, FormsModule, SkillFormComponent],
  templateUrl: './skills.html',
  styleUrl: './skills.scss',
})
export class Skills implements OnInit {
  private readonly skillsService = inject(SkillsService);
  private readonly userSkillsService = inject(UserSkillsService);

  readonly searchQuery = signal('');
  readonly selectedCategory = signal<'ALL' | SkillCategory>('ALL');
  readonly selectedStatus = signal<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  readonly skills = signal<Skill[]>([]);
  readonly isLoading = signal(true);
  readonly loadErrorMessage = signal<string | null>(null);
  readonly saveErrorMessage = signal<string | null>(null);
  readonly formMode = signal<'create' | 'edit'>('create');
  readonly editingSkillId = signal<string | null>(null);
  readonly isSaving = signal(false);
  readonly togglingSkillIds = signal<string[]>([]);
  readonly addingSkillIds = signal<string[]>([]);
  readonly trackedSkillIds = signal<string[]>([]);
  readonly addErrorMessage = signal<string | null>(null);

  readonly categories: SkillCategory[] = [
    'FRONTEND',
    'BACKEND',
    'DEVOPS',
    'DATABASE',
    'TESTING',
    'SOFT_SKILL',
    'LANGUAGE',
    'TOOLING',
    'OTHER',
  ];

  readonly stats = computed(() => {
    const skills = this.skills();

    return {
      total: skills.length,
      active: skills.filter((skill) => skill.isActive).length,
      categories: new Set(skills.map((skill) => skill.category)).size,
    };
  });

  readonly editingSkill = computed(() => {
    const editingSkillId = this.editingSkillId();

    return this.skills().find((skill) => skill.id === editingSkillId) ?? null;
  });

  readonly parentOptions = computed(() => {
    const editingSkillId = this.editingSkillId();

    return this.skills().filter((skill) => skill.id !== editingSkillId);
  });

  readonly filteredSkills = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const category = this.selectedCategory();
    const status = this.selectedStatus();

    return this.skills().filter((skill) => {
      const matchesQuery =
        query.length === 0 ||
        skill.name.toLowerCase().includes(query) ||
        (skill.description?.toLowerCase().includes(query) ?? false);
      const matchesCategory = category === 'ALL' || skill.category === category;
      const matchesStatus =
        status === 'ALL' ||
        (status === 'ACTIVE' ? skill.isActive : !skill.isActive);

      return matchesQuery && matchesCategory && matchesStatus;
    });
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadSkills(), this.loadTrackedSkills()]);
  }

  formatCategory(category: SkillCategory): string {
    return category.replace('_', ' ');
  }

  hasActiveFilters(): boolean {
    return (
      this.searchQuery().trim().length > 0 ||
      this.selectedCategory() !== 'ALL' ||
      this.selectedStatus() !== 'ALL'
    );
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategory.set('ALL');
    this.selectedStatus.set('ALL');
  }

  startCreate(): void {
    this.formMode.set('create');
    this.editingSkillId.set(null);
    this.saveErrorMessage.set(null);
  }

  startEdit(skill: Skill): void {
    this.formMode.set('edit');
    this.editingSkillId.set(skill.id);
    this.saveErrorMessage.set(null);
  }

  cancelEdit(): void {
    this.startCreate();
  }

  isToggling(skillId: string): boolean {
    return this.togglingSkillIds().includes(skillId);
  }

  isTracked(skillId: string): boolean {
    return this.trackedSkillIds().includes(skillId);
  }

  isAdding(skillId: string): boolean {
    return this.addingSkillIds().includes(skillId);
  }

  async saveSkill(payload: SkillFormPayload): Promise<void> {
    this.isSaving.set(true);
    this.saveErrorMessage.set(null);

    try {
      if (this.formMode() === 'edit' && this.editingSkill()) {
        const updatedSkill = await this.skillsService.updateSkill(
          this.editingSkill()!.id,
          this.toUpdatePayload(payload),
        );
        this.replaceSkill(updatedSkill);
        this.startCreate();
        return;
      }

      const createdSkill = await this.skillsService.createSkill(
        this.toCreatePayload(payload),
      );
      this.skills.update((skills) =>
        [...skills, createdSkill].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      );
      this.startCreate();
    } catch (error) {
      this.saveErrorMessage.set(this.getErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  async toggleSkillStatus(skill: Skill): Promise<void> {
    this.markToggling(skill.id, true);
    this.saveErrorMessage.set(null);

    try {
      const updatedSkill = await this.skillsService.updateSkill(skill.id, {
        isActive: !skill.isActive,
      });
      this.replaceSkill(updatedSkill);
    } catch (error) {
      this.saveErrorMessage.set(this.getErrorMessage(error));
    } finally {
      this.markToggling(skill.id, false);
    }
  }

  async addToMySkills(skill: Skill): Promise<void> {
    if (this.isTracked(skill.id) || this.isAdding(skill.id)) {
      return;
    }

    this.markAdding(skill.id, true);
    this.addErrorMessage.set(null);

    try {
      await this.userSkillsService.createUserSkill(
        this.toCreateUserSkillPayload(skill.id),
      );
      this.trackedSkillIds.update((ids) => [...ids, skill.id]);
    } catch (error) {
      const message = this.getErrorMessage(
        error,
        `Could not add ${skill.name} to your skills right now.`,
      );

      if (message.includes('already exists')) {
        this.trackedSkillIds.update((ids) =>
          ids.includes(skill.id) ? ids : [...ids, skill.id],
        );
      } else {
        this.addErrorMessage.set(message);
      }
    } finally {
      this.markAdding(skill.id, false);
    }
  }

  trackSkill(_: number, skill: Skill): string {
    return skill.id;
  }

  private async loadSkills(): Promise<void> {
    this.isLoading.set(true);
    this.loadErrorMessage.set(null);

    try {
      const skills = await this.skillsService.getSkills();
      this.skills.set(skills);
    } catch {
      this.loadErrorMessage.set('Could not load the skills catalog right now.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadTrackedSkills(): Promise<void> {
    try {
      const userSkills = await this.userSkillsService.getUserSkills();
      this.trackedSkillIds.set(
        userSkills.map((userSkill) => userSkill.skillId),
      );
    } catch {
      this.addErrorMessage.set('Could not load your tracked skills right now.');
    }
  }

  private replaceSkill(updatedSkill: Skill): void {
    this.skills.update((skills) =>
      skills.map((skill) =>
        skill.id === updatedSkill.id ? updatedSkill : skill,
      ),
    );
  }

  private markToggling(id: string, isToggling: boolean): void {
    this.togglingSkillIds.update((ids) =>
      isToggling ? [...ids, id] : ids.filter((currentId) => currentId !== id),
    );
  }

  private markAdding(id: string, isAdding: boolean): void {
    this.addingSkillIds.update((ids) =>
      isAdding ? [...ids, id] : ids.filter((currentId) => currentId !== id),
    );
  }

  private toCreatePayload(payload: SkillFormPayload): CreateSkillRequest {
    return {
      name: payload.name,
      description: payload.description,
      category: payload.category,
      isActive: payload.isActive,
      ...(payload.parentSkillId
        ? { parentSkillId: payload.parentSkillId }
        : {}),
    };
  }

  private toUpdatePayload(payload: SkillFormPayload): UpdateSkillRequest {
    return {
      name: payload.name,
      description: payload.description,
      category: payload.category,
      isActive: payload.isActive,
      parentSkillId: payload.parentSkillId ?? null,
    };
  }

  private toCreateUserSkillPayload(skillId: string): CreateUserSkillRequest {
    return { skillId };
  }

  private getErrorMessage(
    error: unknown,
    fallback = 'Could not save the skill right now.',
  ): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof error.error === 'object' &&
      error.error !== null &&
      'message' in error.error
    ) {
      const message = error.error.message;

      if (typeof message === 'string') {
        return message;
      }
    }

    return fallback;
  }
}
