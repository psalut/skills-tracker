import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Skill, SkillCategory } from '../skill.model';

type SkillFormValue = {
  name: string;
  description: string;
  category: SkillCategory;
  isActive: boolean;
  parentSkillId: string;
};

@Component({
  selector: 'app-skill-form',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="surface section skill-form">
      <div class="skill-form__header">
        <div>
          <p class="skill-form__eyebrow">{{ modeLabel }}</p>
          <h2>{{ title }}</h2>
          <p>{{ descriptionText }}</p>
        </div>

        @if (skill) {
          <button
            type="button"
            class="button skill-form__ghost"
            (click)="cancel.emit()"
          >
            Cancel
          </button>
        }
      </div>

      <form class="skill-form__body" [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-field">
          <label class="form-label" for="skill-name">Name</label>
          <input
            id="skill-name"
            class="form-input"
            type="text"
            formControlName="name"
            placeholder="Angular, NestJS, Docker..."
          />
          @if (isInvalid('name')) {
            <p class="form-error">Name must have at least 2 characters.</p>
          }
        </div>

        <div class="form-field">
          <label class="form-label" for="skill-description">Description</label>
          <textarea
            id="skill-description"
            class="form-input skill-form__textarea"
            formControlName="description"
            rows="4"
            placeholder="Short description of the skill."
          ></textarea>
        </div>

        <div class="skill-form__grid">
          <div class="form-field">
            <label class="form-label" for="skill-category">Category</label>
            <select
              id="skill-category"
              class="form-input"
              formControlName="category"
            >
              @for (category of categories; track category) {
                <option [value]="category">
                  {{ formatCategory(category) }}
                </option>
              }
            </select>
          </div>

          <div class="form-field">
            <label class="form-label" for="skill-parent">Parent skill</label>
            <select
              id="skill-parent"
              class="form-input"
              formControlName="parentSkillId"
            >
              <option value="">No parent</option>
              @for (option of parentOptions; track option.id) {
                <option [value]="option.id">{{ option.name }}</option>
              }
            </select>
          </div>
        </div>

        <label class="skill-form__checkbox">
          <input type="checkbox" formControlName="isActive" />
          <span>Skill is active</span>
        </label>

        @if (errorMessage) {
          <p class="form-error">{{ errorMessage }}</p>
        }

        <div class="skill-form__actions">
          @if (skill) {
            <button
              type="button"
              class="button skill-form__ghost"
              (click)="cancel.emit()"
            >
              Cancel
            </button>
          }
          <button
            type="submit"
            class="button button--primary"
            [disabled]="isSaving || form.invalid"
          >
            {{ isSaving ? 'Saving...' : submitLabel }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [
    `
      .skill-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      .skill-form__header {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: var(--space-4);
      }

      .skill-form__eyebrow {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-primary);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: var(--space-2);
      }

      .skill-form__body {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .skill-form__grid {
        display: grid;
        gap: var(--space-4);
      }

      .skill-form__textarea {
        resize: vertical;
        min-height: 120px;
      }

      .skill-form__checkbox {
        display: inline-flex;
        align-items: center;
        gap: var(--space-3);
        font-weight: var(--font-weight-medium);
        color: var(--color-text);
      }

      .skill-form__checkbox input {
        width: 1rem;
        height: 1rem;
      }

      .skill-form__actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-3);
      }

      .skill-form__ghost {
        background: var(--color-surface-muted);
        color: var(--color-text);
      }

      @media (min-width: 768px) {
        .skill-form__grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `,
  ],
})
export class SkillFormComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);

  @Input({ required: true }) categories: SkillCategory[] = [];
  @Input({ required: true }) parentOptions: Skill[] = [];
  @Input() skill: Skill | null = null;
  @Input() isSaving = false;
  @Input() errorMessage: string | null = null;

  @Output() readonly save = new EventEmitter<{
    name: string;
    description?: string;
    category: SkillCategory;
    isActive: boolean;
    parentSkillId?: string | null;
  }>();
  @Output() readonly cancel = new EventEmitter<void>();

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    category: ['OTHER' as SkillCategory, [Validators.required]],
    isActive: [true],
    parentSkillId: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ('skill' in changes) {
      this.form.reset(this.toFormValue(this.skill));
    }
  }

  get modeLabel(): string {
    return this.skill ? 'Edit skill' : 'New skill';
  }

  get title(): string {
    return this.skill ? `Update ${this.skill.name}` : 'Create a new skill';
  }

  get descriptionText(): string {
    return this.skill
      ? 'Adjust the metadata, hierarchy, or availability of this skill.'
      : 'Add a new skill to the catalog and optionally link it under a parent skill.';
  }

  get submitLabel(): string {
    return this.skill ? 'Save changes' : 'Create skill';
  }

  formatCategory(category: SkillCategory): string {
    return category.replace('_', ' ');
  }

  isInvalid(controlName: keyof SkillFormValue): boolean {
    const control = this.form.controls[controlName];

    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.save.emit({
      name: value.name.trim(),
      description: value.description.trim() || undefined,
      category: value.category,
      isActive: value.isActive,
      parentSkillId: value.parentSkillId || null,
    });
  }

  private toFormValue(skill: Skill | null): SkillFormValue {
    return {
      name: skill?.name ?? '',
      description: skill?.description ?? '',
      category: skill?.category ?? 'OTHER',
      isActive: skill?.isActive ?? true,
      parentSkillId: skill?.parentSkillId ?? '',
    };
  }
}
