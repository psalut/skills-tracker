import axios from 'axios';
import { resetDatabase } from '../support/reset-database';
import { createTestSkill } from '../support/factories/skill.factory';
import { createTestUser, disconnectUserFactoryPrisma } from '../support/factories/user.factory';

describe('UserSkills API (e2e)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectUserFactoryPrisma();
  });


  it('POST /user-skills should create a user-skill relation', async () => {
    const user = await createTestUser();
    const skill = await createTestSkill();

    const response = await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill.id,
      currentLevel: 'BEGINNER',
      targetLevel: 'ADVANCED',
      notes: 'Practicing every day.',
    });

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      userId: user.id,
      skillId: skill.id,
      currentLevel: 'BEGINNER',
      targetLevel: 'ADVANCED',
      notes: 'Practicing every day.',
    });
    expect(response.data.id).toEqual(expect.any(String));
    expect(response.data.user.id).toBe(user.id);
    expect(response.data.skill.id).toBe(skill.id);
  });

  it('POST /user-skills should create a relation with only required fields', async () => {
    const user = await createTestUser();
    const skill = await createTestSkill();

    const response = await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill.id,
    });

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      userId: user.id,
      skillId: skill.id,
      currentLevel: null,
      targetLevel: null,
      notes: null,
    });
  });

  it('POST /user-skills should return 409 when relation already exists', async () => {
    const user = await createTestUser();
    const skill = await createTestSkill();

    await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill.id,
    });

    const response = await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill.id,
    });

    expect(response.status).toBe(409);
    expect(response.data.message).toBe(
      `UserSkill already exists for user "${user.id}" and skill "${skill.id}"`,
    );
  });

  it('POST /user-skills should return 404 when user does not exist', async () => {
    const skill = await createTestSkill();

    const response = await axios.post('/user-skills', {
      userId: 'non-existing-user-id',
      skillId: skill.id,
    });

    expect(response.status).toBe(404);
    expect(response.data.message).toBe(
      'User with id "non-existing-user-id" not found',
    );
  });

  it('POST /user-skills should return 404 when skill does not exist', async () => {
    const user = await createTestUser();

    const response = await axios.post('/user-skills', {
      userId: user.id,
      skillId: 'non-existing-skill-id',
    });

    expect(response.status).toBe(404);
    expect(response.data.message).toBe(
      'Active skill with id "non-existing-skill-id" not found',
    );
  });

  it('POST /user-skills should return 400 for invalid currentLevel enum', async () => {
    const user = await createTestUser();
    const skill = await createTestSkill();

    const response = await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill.id,
      currentLevel: 'MASTER',
    });

    expect(response.status).toBe(400);
  });

  it('GET /user-skills should return all user-skill relations', async () => {
    const user = await createTestUser();
    const skill1 = await createTestSkill({ name: 'NestJS' });
    const skill2 = await createTestSkill({ name: 'TypeScript' });

    await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill1.id,
      currentLevel: 'BEGINNER',
    });

    await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill2.id,
      currentLevel: 'INTERMEDIATE',
    });

    const response = await axios.get('/user-skills');

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(2);
    expect(response.data[0]).toHaveProperty('id');
    expect(response.data[0]).toHaveProperty('user');
    expect(response.data[0]).toHaveProperty('skill');
  });

  it('GET /user-skills/:id should return a user-skill relation', async () => {
    const user = await createTestUser();
    const skill = await createTestSkill();

    const created = await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill.id,
      currentLevel: 'BEGINNER',
    });

    const response = await axios.get(`/user-skills/${created.data.id}`);

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      id: created.data.id,
      userId: user.id,
      skillId: skill.id,
      currentLevel: 'BEGINNER',
    });
  });

  it('GET /user-skills/:id should return 404 when relation does not exist', async () => {
    const response = await axios.get('/user-skills/non-existing-id');

    expect(response.status).toBe(404);
    expect(response.data.message).toBe(
      'UserSkill with id "non-existing-id" not found',
    );
  });

  it('GET /users/:userId/skills should return all skills for a user', async () => {
    const user = await createTestUser();
    const skill1 = await createTestSkill({ name: 'NestJS' });
    const skill2 = await createTestSkill({ name: 'TypeScript' });

    await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill1.id,
      currentLevel: 'BEGINNER',
    });

    await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill2.id,
      currentLevel: 'ADVANCED',
    });

    const response = await axios.get(`/users/${user.id}/skills`);

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(2);
    expect(response.data[0].userId).toBe(user.id);
    expect(response.data[0]).toHaveProperty('skill');
  });

  it('GET /users/:userId/skills should return an empty array for a user without skills', async () => {
    const user = await createTestUser();

    const response = await axios.get(`/users/${user.id}/skills`);

    expect(response.status).toBe(200);
    expect(response.data).toEqual([]);
  });

  it('GET /users/:userId/skills should return 404 when user does not exist', async () => {
    const response = await axios.get('/users/non-existing-user-id/skills');

    expect(response.status).toBe(404);
    expect(response.data.message).toBe(
      'User with id "non-existing-user-id" not found',
    );
  });

  it('PATCH /user-skills/:id should update a user-skill relation', async () => {
    const user = await createTestUser();
    const skill = await createTestSkill();

    const created = await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill.id,
      currentLevel: 'BEGINNER',
      targetLevel: 'INTERMEDIATE',
      notes: 'Initial notes',
    });

    const response = await axios.patch(`/user-skills/${created.data.id}`, {
      currentLevel: 'ADVANCED',
      targetLevel: 'EXPERT',
      notes: 'Improved a lot',
    });

    expect(response.status).toBe(200);
    expect(response.data).toMatchObject({
      id: created.data.id,
      userId: user.id,
      skillId: skill.id,
      currentLevel: 'ADVANCED',
      targetLevel: 'EXPERT',
      notes: 'Improved a lot',
    });
  });

  it('PATCH /user-skills/:id should return 400 for invalid targetLevel enum', async () => {
    const user = await createTestUser();
    const skill = await createTestSkill();

    const created = await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill.id,
    });

    const response = await axios.patch(`/user-skills/${created.data.id}`, {
      targetLevel: 'LEGEND',
    });

    expect(response.status).toBe(400);
  });

  it('PATCH /user-skills/:id should return 404 when relation does not exist', async () => {
    const response = await axios.patch('/user-skills/non-existing-id', {
      currentLevel: 'INTERMEDIATE',
    });

    expect(response.status).toBe(404);
    expect(response.data.message).toBe(
      'UserSkill with id "non-existing-id" not found',
    );
  });

  it('DELETE /user-skills/:id should delete a user-skill relation', async () => {
    const user = await createTestUser();
    const skill = await createTestSkill();

    const created = await axios.post('/user-skills', {
      userId: user.id,
      skillId: skill.id,
    });

    const response = await axios.delete(`/user-skills/${created.data.id}`);

    expect(response.status).toBe(200);
    expect(response.data.message).toBe(
      `UserSkill with id "${created.data.id}" deleted successfully`,
    );

    const getResponse = await axios.get(`/user-skills/${created.data.id}`);
    expect(getResponse.status).toBe(404);
  });

  it('DELETE /user-skills/:id should return 404 when relation does not exist', async () => {
    const response = await axios.delete('/user-skills/non-existing-id');

    expect(response.status).toBe(404);
    expect(response.data.message).toBe(
      'UserSkill with id "non-existing-id" not found',
    );
  });
});