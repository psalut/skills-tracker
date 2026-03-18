import { TestBed } from '@angular/core/testing';
import { Skills } from './skills';
import { Skill, UserSkill } from './skill.model';
import { SkillsService } from './skills.service';
import { UserSkillsService } from '../user-skills/user-skills.service';

function createSkill(name: string, overrides: Partial<Skill> = {}): Skill {
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  return {
    id: `skill-${slug}`,
    name,
    description: `${name} description`,
    category: 'FRONTEND',
    parentSkillId: null,
    isActive: true,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

function createTrackedSkill(skill: Skill): UserSkill {
  return {
    id: `user-${skill.id}`,
    userId: 'user-1',
    skillId: skill.id,
    currentLevel: 'INTERMEDIATE',
    notes: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    skill,
  };
}

describe('Skills', () => {
  async function setup({
    getSkills = vi.fn(async () => [] as Skill[]),
    createSkillRequest = vi.fn(async (_payload) =>
      createSkill('Created skill'),
    ),
    updateSkill = vi.fn(async (id: string, payload: Partial<Skill>) =>
      createSkill('Updated skill', {
        id,
        ...payload,
      }),
    ),
    getUserSkills = vi.fn(async () => [] as UserSkill[]),
    createUserSkill = vi.fn(async ({ skillId }: { skillId: string }) =>
      createTrackedSkill(createSkill('Tracked', { id: skillId })),
    ),
  }: {
    getSkills?: ReturnType<typeof vi.fn>;
    createSkillRequest?: ReturnType<typeof vi.fn>;
    updateSkill?: ReturnType<typeof vi.fn>;
    getUserSkills?: ReturnType<typeof vi.fn>;
    createUserSkill?: ReturnType<typeof vi.fn>;
  } = {}) {
    const skillsService = {
      getSkills,
      createSkill: createSkillRequest,
      updateSkill,
    };

    const userSkillsService = {
      getUserSkills,
      createUserSkill,
    };

    await TestBed.configureTestingModule({
      imports: [Skills],
      providers: [
        { provide: SkillsService, useValue: skillsService },
        { provide: UserSkillsService, useValue: userSkillsService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Skills);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return {
      fixture,
      component: fixture.componentInstance,
      skillsService,
      userSkillsService,
    };
  }

  it('loads the catalog, computes stats, and filters visible skills', async () => {
    const angular = createSkill('Angular', { category: 'FRONTEND' });
    const docker = createSkill('Docker', {
      category: 'DEVOPS',
      isActive: false,
    });
    const english = createSkill('English', {
      category: 'LANGUAGE',
      description: 'Language practice',
    });

    const { fixture, component } = await setup({
      getSkills: vi.fn(async () => [angular, docker, english]),
      getUserSkills: vi.fn(async () => [createTrackedSkill(angular)]),
    });

    expect(component.stats()).toEqual({
      total: 3,
      active: 2,
      categories: 3,
    });
    expect(component.trackedSkillIds()).toEqual([angular.id]);

    component.searchQuery.set('dock');
    fixture.detectChanges();
    expect(component.filteredSkills().map((skill) => skill.name)).toEqual([
      'Docker',
    ]);

    component.searchQuery.set('');
    component.selectedCategory.set('LANGUAGE');
    fixture.detectChanges();
    expect(component.filteredSkills().map((skill) => skill.name)).toEqual([
      'English',
    ]);

    component.selectedCategory.set('ALL');
    component.selectedStatus.set('INACTIVE');
    fixture.detectChanges();
    expect(component.filteredSkills().map((skill) => skill.name)).toEqual([
      'Docker',
    ]);
  });

  it('adds a skill to my skills and updates the tracked state', async () => {
    const docker = createSkill('Docker');
    const { component, userSkillsService } = await setup({
      getSkills: vi.fn(async () => [docker]),
      getUserSkills: vi.fn(async () => []),
      createUserSkill: vi.fn(async ({ skillId }: { skillId: string }) =>
        createTrackedSkill(createSkill('Docker', { id: skillId })),
      ),
    });

    await component.addToMySkills(docker);

    expect(userSkillsService.createUserSkill).toHaveBeenCalledWith({
      skillId: docker.id,
    });
    expect(component.isTracked(docker.id)).toBe(true);
    expect(component.addErrorMessage()).toBeNull();
  });

  it('treats duplicate add errors as already tracked and keeps the UI consistent', async () => {
    const nest = createSkill('NestJS');

    const { component } = await setup({
      getSkills: vi.fn(async () => [nest]),
      getUserSkills: vi.fn(async () => []),
      createUserSkill: vi.fn(async () => {
        throw {
          error: {
            message: 'Skill already exists for this user',
          },
        };
      }),
    });

    await component.addToMySkills(nest);

    expect(component.isTracked(nest.id)).toBe(true);
    expect(component.addErrorMessage()).toBeNull();
  });

  it('surfaces a catalog load error when skills cannot be fetched', async () => {
    const { fixture, component } = await setup({
      getSkills: vi.fn(async () => {
        throw new Error('load failed');
      }),
    });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(component.loadErrorMessage()).toBe(
      'Could not load the skills catalog right now.',
    );
    expect(compiled.textContent).toContain(
      'Could not load the skills catalog right now.',
    );
  });
});
