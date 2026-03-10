import axios from 'axios';

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createTestSkill(overrides?: {
  name?: string;
  description?: string;
  category?:
    | 'FRONTEND'
    | 'BACKEND'
    | 'DEVOPS'
    | 'DATABASE'
    | 'TESTING'
    | 'SOFT_SKILL'
    | 'LANGUAGE'
    | 'TOOLING'
    | 'OTHER';
  parentSkillId?: string | null;
  isActive?: boolean;
}) {
  const name = overrides?.name ?? `Skill-${uniqueSuffix()}`;

  const response = await axios.post('/skills', {
    name,
    description: overrides?.description ?? `${name} description`,
    category: overrides?.category ?? 'BACKEND',
    parentSkillId: overrides?.parentSkillId ?? null,
    isActive: overrides?.isActive ?? true,
  });

  expect(response.status).toBe(201);
  expect(response.data).toHaveProperty('id');

  return response.data;
}
