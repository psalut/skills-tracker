import { Page, Route } from '@playwright/test';

export type AuthUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type Skill = {
  id: string;
  name: string;
  description: string | null;
  category:
    | 'FRONTEND'
    | 'BACKEND'
    | 'DEVOPS'
    | 'DATABASE'
    | 'TESTING'
    | 'SOFT_SKILL'
    | 'LANGUAGE'
    | 'TOOLING'
    | 'OTHER';
  parentSkillId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type UserSkill = {
  id: string;
  userId: string;
  skillId: string;
  currentLevel:
    | 'BEGINNER'
    | 'BASIC'
    | 'INTERMEDIATE'
    | 'UPPER_INTERMEDIATE'
    | 'ADVANCED'
    | 'EXPERT'
    | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  skill: Skill;
};

export const defaultUser: AuthUser = {
  id: 'user-1',
  email: 'pablo@mail.com',
  firstName: 'Pablo',
  lastName: 'Salut',
};

export function createSkill(
  name: string,
  overrides: Partial<Skill> = {},
): Skill {
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

export function createUserSkill(
  skill: Skill,
  currentLevel: UserSkill['currentLevel'],
  overrides: Partial<UserSkill> = {},
): UserSkill {
  return {
    id: `user-skill-${skill.id}`,
    userId: defaultUser.id,
    skillId: skill.id,
    currentLevel,
    notes: null,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    skill,
    ...overrides,
  };
}

export async function mockJson(
  page: Page,
  path: string | RegExp,
  body: unknown,
  status = 200,
): Promise<void> {
  await page.route(toRoutePattern(path), async (route) => {
    if (!shouldHandleApiRequest(route, path)) {
      await route.fallback();
      return;
    }

    await fulfillJson(route, body, status);
  });
}

export async function mockAuthenticatedSession(
  page: Page,
  options: {
    user?: AuthUser;
    token?: string;
  } = {},
): Promise<void> {
  const user = options.user ?? defaultUser;
  const token = options.token ?? 'test-access-token';

  await page.addInitScript((accessToken) => {
    window.localStorage.setItem('access_token', accessToken);
  }, token);

  await mockCurrentUser(page, user);
}

export async function mockCurrentUser(
  page: Page,
  user: AuthUser = defaultUser,
): Promise<void> {
  await mockJson(page, '/auth/me', user);
}

export async function mockUserSkills(
  page: Page,
  body: UserSkill[],
  status = 200,
): Promise<void> {
  await mockJson(page, '/user-skills', body, status);
}

export async function mockSkills(
  page: Page,
  body: Skill[],
  status = 200,
): Promise<void> {
  await mockJson(page, '/skills', body, status);
}

export async function mockLogin(
  page: Page,
  options: {
    token?: string;
    status?: number;
    body?: unknown;
  } = {},
): Promise<void> {
  const token = options.token ?? 'test-access-token';
  const status = options.status ?? 201;
  const body = options.body ?? { accessToken: token };

  await page.route('**/auth/login', async (route) => {
    await fulfillJson(route, body, status);
  });
}

async function fulfillJson(
  route: Route,
  body: unknown,
  status = 200,
): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function toRoutePattern(path: string | RegExp): string | RegExp {
  if (path instanceof RegExp) {
    return path;
  }

  return `**${path}`;
}

function shouldHandleApiRequest(route: Route, path: string | RegExp): boolean {
  const resourceType = route.request().resourceType();

  if (resourceType !== 'fetch' && resourceType !== 'xhr') {
    return false;
  }

  const pathname = new URL(route.request().url()).pathname;

  if (path instanceof RegExp) {
    return path.test(pathname);
  }

  return pathname === path || pathname.endsWith(path);
}
