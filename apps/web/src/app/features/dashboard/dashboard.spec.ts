import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Dashboard } from './dashboard';
import { UserSkillsService } from '../user-skills/user-skills.service';
import { UserSkill } from '../skills/skill.model';

function createUserSkill(
  name: string,
  currentLevel: UserSkill['currentLevel'],
  overrides: Partial<UserSkill> = {},
): UserSkill {
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  return {
    id: `user-skill-${slug}`,
    userId: 'user-1',
    skillId: `skill-${slug}`,
    currentLevel,
    notes: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    skill: {
      id: `skill-${slug}`,
      name,
      description: `${name} description`,
      category: 'FRONTEND',
      parentSkillId: null,
      isActive: true,
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
      deletedAt: null,
    },
    ...overrides,
  };
}

describe('Dashboard', () => {
  async function setup({
    getUserSkills = vi.fn(async () => [] as UserSkill[]),
  }: {
    getUserSkills?: ReturnType<typeof vi.fn>;
  } = {}) {
    const userSkillsService = {
      getUserSkills,
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: UserSkillsService, useValue: userSkillsService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return {
      fixture,
      component: fixture.componentInstance,
      userSkillsService,
    };
  }

  it('renders dashboard stats and priority lists from tracked skills', async () => {
    const skills = [
      createUserSkill('Angular', 'INTERMEDIATE'),
      createUserSkill('Docker', 'BASIC'),
      createUserSkill('Testing', 'EXPERT'),
      createUserSkill('English', null, {
        skill: {
          ...createUserSkill('English', null).skill,
          category: 'LANGUAGE',
        },
      }),
    ];

    const { fixture, component } = await setup({
      getUserSkills: vi.fn(async () => skills),
    });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(component.stats()).toEqual([
      { label: 'Tracked skills', value: '4' },
      { label: 'In progress', value: '2' },
      { label: 'Completed', value: '1' },
      { label: 'Not started', value: '1' },
    ]);
    expect(component.needsAttention().map((item) => item.name)).toEqual([
      'Docker',
      'Angular',
    ]);
    expect(component.closestToMastery().map((item) => item.name)).toEqual([
      'Angular',
      'Docker',
    ]);
    expect(compiled.textContent).toContain(
      'Discover the shape of your current progress.',
    );
    expect(compiled.textContent).toContain('What to push next');
    expect(compiled.textContent).toContain('Angular');
    expect(compiled.textContent).toContain('Docker');
  });

  it('renders the empty state when the user has no tracked skills', async () => {
    const { fixture } = await setup({
      getUserSkills: vi.fn(async () => []),
    });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('No tracked skills yet');
    expect(compiled.textContent).toContain('Browse skills');
    expect(compiled.textContent).toContain('Go to My Skills');
  });

  it('retries loading after an initial dashboard error', async () => {
    const getUserSkills = vi
      .fn<() => Promise<UserSkill[]>>()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce([createUserSkill('NestJS', 'ADVANCED')]);

    const { fixture, component } = await setup({ getUserSkills });

    expect(component.loadErrorMessage()).toBe(
      'Could not load your dashboard right now.',
    );

    await component.retry();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(getUserSkills).toHaveBeenCalledTimes(2);
    expect(component.loadErrorMessage()).toBeNull();
    expect(compiled.textContent).toContain('NestJS');
  });
});
