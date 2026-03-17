import axios from 'axios';
import { resetDatabase } from '../support/reset-database';
import { createTestSkill } from '../support/factories/skill.factory';

describe('UserSkills API (e2e)', () => {
  async function registerAndLoginUser() {
    const email = `user-skills-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@mail.com`;
    const password = '12345678';

    const registerResponse = await axios.post('/auth/register', {
      email,
      password,
      firstName: 'User',
      lastName: 'Skills',
    });

    const loginResponse = await axios.post('/auth/login', {
      email,
      password,
    });

    return {
      user: registerResponse.data,
      authHeaders: {
        Authorization: `Bearer ${loginResponse.data.accessToken}`,
      },
    };
  }

  beforeEach(async () => {
    await resetDatabase();
  });

  it('POST /user-skills should create a user-skill relation', async () => {
    const { user, authHeaders } = await registerAndLoginUser();
    const skill = await createTestSkill();

    const response = await axios.post(
      '/user-skills',
      {
        skillId: skill.id,
        currentLevel: 'BEGINNER',
        notes: 'Practicing every day.',
      },
      { headers: authHeaders },
    );

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      userId: user.id,
      skillId: skill.id,
      currentLevel: 'BEGINNER',
      notes: 'Practicing every day.',
    });
    expect(response.data.id).toEqual(expect.any(String));
    expect(response.data.user.id).toBe(user.id);
    expect(response.data.skill.id).toBe(skill.id);
  });

  it('POST /user-skills should create a relation with only required fields', async () => {
    const { user, authHeaders } = await registerAndLoginUser();
    const skill = await createTestSkill();

    const response = await axios.post(
      '/user-skills',
      {
        skillId: skill.id,
      },
      { headers: authHeaders },
    );

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      userId: user.id,
      skillId: skill.id,
      currentLevel: null,
      notes: null,
    });
  });

  it('POST /user-skills should return 409 when relation already exists', async () => {
    const { user, authHeaders } = await registerAndLoginUser();
    const skill = await createTestSkill();

    await axios.post(
      '/user-skills',
      {
        skillId: skill.id,
      },
      { headers: authHeaders },
    );

    const response = await axios.post(
      '/user-skills',
      {
        skillId: skill.id,
      },
      { headers: authHeaders },
    );

    expect(response.status).toBe(409);
    expect(response.data.message).toBe(
      `UserSkill already exists for user "${user.id}" and skill "${skill.id}"`,
    );
  });

  it('POST /user-skills should reject requests without a token', async () => {
    const skill = await createTestSkill();

    const response = await axios.post('/user-skills', {
      skillId: skill.id,
    });

    expect(response.status).toBe(401);
  });

  it('POST /user-skills should return 404 when skill does not exist', async () => {
    const { authHeaders } = await registerAndLoginUser();

    const response = await axios.post(
      '/user-skills',
      {
        skillId: 'non-existing-skill-id',
      },
      { headers: authHeaders },
    );

    expect(response.status).toBe(404);
    expect(response.data.message).toBe(
      'Active skill with id "non-existing-skill-id" not found',
    );
  });

  it('POST /user-skills should return 400 for invalid currentLevel enum', async () => {
    const { authHeaders } = await registerAndLoginUser();
    const skill = await createTestSkill();

    const response = await axios.post(
      '/user-skills',
      {
        skillId: skill.id,
        currentLevel: 'MASTER',
      },
      { headers: authHeaders },
    );

    expect(response.status).toBe(400);
  });

  it('GET /user-skills should return only the authenticated user relations', async () => {
    const { user, authHeaders } = await registerAndLoginUser();
    const { authHeaders: otherAuthHeaders } = await registerAndLoginUser();
    const skill1 = await createTestSkill({ name: 'NestJS' });
    const skill2 = await createTestSkill({ name: 'TypeScript' });
    const skill3 = await createTestSkill({ name: 'PostgreSQL' });

    await axios.post(
      '/user-skills',
      {
        skillId: skill1.id,
        currentLevel: 'BEGINNER',
      },
      { headers: authHeaders },
    );

    await axios.post(
      '/user-skills',
      {
        skillId: skill2.id,
        currentLevel: 'INTERMEDIATE',
      },
      { headers: authHeaders },
    );

    await axios.post(
      '/user-skills',
      {
        skillId: skill3.id,
        currentLevel: 'ADVANCED',
      },
      { headers: otherAuthHeaders },
    );

    const response = await axios.get('/user-skills', {
      headers: authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(2);
    expect(
      response.data.every(
        (item: { userId: string }) => item.userId === user.id,
      ),
    ).toBe(true);
    expect(response.data[0]).toHaveProperty('id');
    expect(response.data[0]).toHaveProperty('user');
    expect(response.data[0]).toHaveProperty('skill');
  });

  it('GET /user-skills/:id should return a user-skill relation', async () => {
    const { user, authHeaders } = await registerAndLoginUser();
    const skill = await createTestSkill();

    const created = await axios.post(
      '/user-skills',
      {
        skillId: skill.id,
        currentLevel: 'BEGINNER',
      },
      { headers: authHeaders },
    );

    const response = await axios.get(`/user-skills/${created.data.id}`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      id: created.data.id,
      userId: user.id,
      skillId: skill.id,
      currentLevel: 'BEGINNER',
    });
  });

  it('GET /user-skills/:id should return 404 for another user relation', async () => {
    const { authHeaders } = await registerAndLoginUser();
    const { authHeaders: otherAuthHeaders } = await registerAndLoginUser();
    const skill = await createTestSkill();

    const created = await axios.post(
      '/user-skills',
      {
        skillId: skill.id,
      },
      { headers: otherAuthHeaders },
    );

    const response = await axios.get(`/user-skills/${created.data.id}`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(404);
    expect(response.data.message).toBe(
      `UserSkill with id "${created.data.id}" not found`,
    );
  });

  it('GET /users/:userId/skills should return all skills for a user', async () => {
    const { user, authHeaders } = await registerAndLoginUser();
    const skill1 = await createTestSkill({ name: 'NestJS' });
    const skill2 = await createTestSkill({ name: 'TypeScript' });

    await axios.post(
      '/user-skills',
      {
        skillId: skill1.id,
        currentLevel: 'BEGINNER',
      },
      { headers: authHeaders },
    );

    await axios.post(
      '/user-skills',
      {
        skillId: skill2.id,
        currentLevel: 'ADVANCED',
      },
      { headers: authHeaders },
    );

    const response = await axios.get(`/users/${user.id}/skills`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(2);
    expect(response.data[0].userId).toBe(user.id);
    expect(response.data[0]).toHaveProperty('skill');
  });

  it('GET /users/:userId/skills should return an empty array for a user without skills', async () => {
    const { user, authHeaders } = await registerAndLoginUser();

    const response = await axios.get(`/users/${user.id}/skills`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual([]);
  });

  it('GET /users/:userId/skills should return 403 for another user', async () => {
    const { authHeaders } = await registerAndLoginUser();
    const { user: otherUser } = await registerAndLoginUser();

    const response = await axios.get(`/users/${otherUser.id}/skills`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(403);
    expect(response.data.message).toBe('You can only access your own skills');
  });

  it('PATCH /user-skills/:id should update a user-skill relation', async () => {
    const { user, authHeaders } = await registerAndLoginUser();
    const skill = await createTestSkill();

    const created = await axios.post(
      '/user-skills',
      {
        skillId: skill.id,
        currentLevel: 'BEGINNER',
        notes: 'Initial notes',
      },
      { headers: authHeaders },
    );

    const response = await axios.patch(
      `/user-skills/${created.data.id}`,
      {
        currentLevel: 'ADVANCED',
        notes: 'Improved a lot',
      },
      { headers: authHeaders },
    );

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      id: created.data.id,
      userId: user.id,
      skillId: skill.id,
      currentLevel: 'ADVANCED',
      notes: 'Improved a lot',
    });
  });

  it('PATCH /user-skills/:id should return 400 for invalid currentLevel enum', async () => {
    const { authHeaders } = await registerAndLoginUser();
    const skill = await createTestSkill();

    const created = await axios.post(
      '/user-skills',
      {
        skillId: skill.id,
      },
      { headers: authHeaders },
    );

    const response = await axios.patch(
      `/user-skills/${created.data.id}`,
      {
        currentLevel: 'LEGEND',
      },
      { headers: authHeaders },
    );

    expect(response.status).toBe(400);
  });

  it('PATCH /user-skills/:id should return 404 when relation does not exist', async () => {
    const { authHeaders } = await registerAndLoginUser();

    const response = await axios.patch(
      '/user-skills/non-existing-id',
      {
        currentLevel: 'INTERMEDIATE',
      },
      { headers: authHeaders },
    );

    expect(response.status).toBe(404);
    expect(response.data.message).toBe(
      'UserSkill with id "non-existing-id" not found',
    );
  });

  it('DELETE /user-skills/:id should delete a user-skill relation', async () => {
    const { authHeaders } = await registerAndLoginUser();
    const skill = await createTestSkill();

    const created = await axios.post(
      '/user-skills',
      {
        skillId: skill.id,
      },
      { headers: authHeaders },
    );

    const response = await axios.delete(`/user-skills/${created.data.id}`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.data.message).toBe(
      `UserSkill with id "${created.data.id}" deleted successfully`,
    );

    const getResponse = await axios.get(`/user-skills/${created.data.id}`, {
      headers: authHeaders,
    });
    expect(getResponse.status).toBe(404);
  });

  it('DELETE /user-skills/:id should return 404 when relation does not exist', async () => {
    const { authHeaders } = await registerAndLoginUser();

    const response = await axios.delete('/user-skills/non-existing-id', {
      headers: authHeaders,
    });

    expect(response.status).toBe(404);
    expect(response.data.message).toBe(
      'UserSkill with id "non-existing-id" not found',
    );
  });
});
