import { TestBed } from '@angular/core/testing';
import { UserSkill } from '../skills/skill.model';
import { UserSkills } from './user-skills';
import { UserSkillsService } from './user-skills.service';

function createUserSkill(overrides: Partial<UserSkill> = {}): UserSkill {
  return {
    id: 'user-skill-1',
    userId: 'user-1',
    skillId: 'skill-1',
    currentLevel: 'INTERMEDIATE',
    notes: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    skill: {
      id: 'skill-1',
      name: 'Angular',
      description: 'Frontend framework',
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

describe('UserSkills', () => {
  async function setup({
    getUserSkills = async () => [],
    updateUserSkill = async (
      _id: string,
      _payload: {
        currentLevel?: UserSkill['currentLevel'];
        notes?: string | null;
      },
    ) => createUserSkill(),
  }: {
    getUserSkills?: () => Promise<UserSkill[]>;
    updateUserSkill?: (
      id: string,
      payload: {
        currentLevel?: UserSkill['currentLevel'];
        notes?: string | null;
      },
    ) => Promise<UserSkill>;
  } = {}) {
    const userSkillsService = {
      getUserSkills: vi.fn(getUserSkills),
      updateUserSkill: vi.fn(updateUserSkill),
    };

    await TestBed.configureTestingModule({
      imports: [UserSkills],
      providers: [
        {
          provide: UserSkillsService,
          useValue: userSkillsService,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(UserSkills);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return {
      fixture,
      component: fixture.componentInstance,
      userSkillsService,
    };
  }

  it('calculates progress based on the fixed mastery scale', async () => {
    const { component } = await setup();

    expect(component.getProgress(createUserSkill({ currentLevel: null }))).toBe(
      0,
    );
    expect(
      component.getProgress(createUserSkill({ currentLevel: 'INTERMEDIATE' })),
    ).toBe(50);
    expect(
      component.getProgress(createUserSkill({ currentLevel: 'EXPERT' })),
    ).toBe(100);
  });

  it('enforces level boundaries for decrease and increase actions', async () => {
    const { component } = await setup();

    expect(
      component.canDecrease(
        createUserSkill({ id: 'beginner', currentLevel: null }),
      ),
    ).toBe(false);
    expect(
      component.canIncrease(
        createUserSkill({ id: 'expert', currentLevel: 'EXPERT' }),
      ),
    ).toBe(false);

    component['updatingSkillIds'].set(['busy-skill']);

    expect(
      component.canDecrease(
        createUserSkill({ id: 'busy-skill', currentLevel: 'BASIC' }),
      ),
    ).toBe(false);
    expect(
      component.canIncrease(
        createUserSkill({ id: 'busy-skill', currentLevel: 'BASIC' }),
      ),
    ).toBe(false);
  });

  it('renders the empty state when the user has no tracked skills', async () => {
    const { fixture } = await setup({
      getUserSkills: async () => [],
    });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('No skills yet');
    expect(compiled.textContent).toContain(
      'You do not have any tracked skills yet.',
    );
  });

  it('renders the load error state when the initial fetch fails', async () => {
    const { fixture } = await setup({
      getUserSkills: async () => {
        throw new Error('load failed');
      },
    });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain(
      'Could not load your skills right now.',
    );
  });

  it('renders an update error without replacing the loaded content', async () => {
    const userSkill = createUserSkill();
    const { component, fixture } = await setup({
      getUserSkills: async () => [userSkill],
      updateUserSkill: async () => {
        throw new Error('update failed');
      },
    });

    await component.increaseProgress(userSkill);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain(
      'Could not update Angular right now.',
    );
    expect(compiled.textContent).toContain('Angular');
    expect(compiled.textContent).not.toContain(
      'Could not load your skills right now.',
    );
  });
});
