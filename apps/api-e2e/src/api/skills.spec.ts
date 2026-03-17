import axios from 'axios';
import {
  createAndLoginAdmin,
  registerAndLoginUser,
} from '../support/auth-helpers';
import { createTestSkill } from '../support/factories/skill.factory';
import { resetDatabase } from '../support/reset-database';

describe('Skills API (e2e)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('GET /skills should reject missing token', async () => {
    const response = await axios.get('/skills');

    expect(response.status).toBe(401);
  });

  it('POST /skills should return 403 for a non-admin user', async () => {
    const { authHeaders } = await registerAndLoginUser();

    const response = await axios.post(
      '/skills',
      {
        name: 'NestJS',
      },
      {
        headers: authHeaders,
      },
    );

    expect(response.status).toBe(403);
    expect(response.data.message).toBe('Insufficient permissions');
  });

  it('POST /skills should create a root skill for an admin', async () => {
    const { authHeaders } = await createAndLoginAdmin();

    const response = await axios.post(
      '/skills',
      {
        name: 'NestJS',
        description: 'Node.js framework',
      },
      {
        headers: authHeaders,
      },
    );

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      name: 'NestJS',
      description: 'Node.js framework',
      parentSkillId: null,
    });
    expect(response.data.id).toEqual(expect.any(String));
  });

  it('POST /skills should create a sub-skill for an admin', async () => {
    const { authHeaders } = await createAndLoginAdmin();

    const parentResponse = await axios.post(
      '/skills',
      {
        name: 'NestJS',
      },
      {
        headers: authHeaders,
      },
    );

    expect(parentResponse.status).toBe(201);
    expect(parentResponse.data).toHaveProperty('id');

    const parentGetResponse = await axios.get(
      `/skills/${parentResponse.data.id}`,
      {
        headers: authHeaders,
      },
    );
    expect(parentGetResponse.status).toBe(200);

    const response = await axios.post(
      '/skills',
      {
        name: 'Guards',
        parentSkillId: parentResponse.data.id,
      },
      {
        headers: authHeaders,
      },
    );

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      name: 'Guards',
      parentSkillId: parentResponse.data.id,
    });
  });

  it('POST /skills should return 404 if parent skill does not exist', async () => {
    const { authHeaders } = await createAndLoginAdmin();

    const response = await axios.post(
      '/skills',
      {
        name: 'Guards',
        parentSkillId: 'non-existing-id',
      },
      {
        headers: authHeaders,
      },
    );

    expect(response.status).toBe(404);
    expect(response.data.message).toBe('Parent skill not found');
  });

  it('GET /skills should return only non-deleted skills to authenticated users', async () => {
    const { authHeaders } = await registerAndLoginUser();
    const { authHeaders: adminHeaders } = await createAndLoginAdmin();
    const skill = await createTestSkill({ name: 'NestJS' });

    await axios.delete(`/skills/${skill.id}`, {
      headers: adminHeaders,
    });

    const response = await axios.get('/skills', {
      headers: authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual([]);
  });

  it('GET /skills/roots should return only root skills to authenticated users', async () => {
    const { authHeaders } = await registerAndLoginUser();
    const parent = await createTestSkill({ name: 'NestJS' });
    await createTestSkill({
      name: 'Guards',
      parentSkillId: parent.id,
    });

    const response = await axios.get('/skills/roots', {
      headers: authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe('NestJS');
  });

  it('GET /skills/:id should return a skill to authenticated users', async () => {
    const { authHeaders } = await registerAndLoginUser();
    const created = await createTestSkill({ name: 'NestJS' });

    const response = await axios.get(`/skills/${created.id}`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(200);
    expect(response.data.name).toBe('NestJS');
  });

  it('PATCH /skills/:id should return 403 for a non-admin user', async () => {
    const { authHeaders } = await registerAndLoginUser();
    const created = await createTestSkill({ name: 'NestJS' });

    const response = await axios.patch(
      `/skills/${created.id}`,
      {
        description: 'Backend framework',
      },
      {
        headers: authHeaders,
      },
    );

    expect(response.status).toBe(403);
    expect(response.data.message).toBe('Insufficient permissions');
  });

  it('PATCH /skills/:id should update a skill for an admin', async () => {
    const { authHeaders } = await createAndLoginAdmin();
    const created = await createTestSkill({ name: 'NestJS' });

    const response = await axios.patch(
      `/skills/${created.id}`,
      {
        description: 'Backend framework',
      },
      {
        headers: authHeaders,
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.description).toBe('Backend framework');
  });

  it('PATCH /skills/:id should return 400 when a skill is its own parent', async () => {
    const { authHeaders } = await createAndLoginAdmin();
    const created = await createTestSkill({ name: 'NestJS' });

    const response = await axios.patch(
      `/skills/${created.id}`,
      {
        parentSkillId: created.id,
      },
      {
        headers: authHeaders,
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.message).toBe('A skill cannot be its own parent');
  });

  it('PATCH /skills/:id should return 400 when trying to create a circular relation', async () => {
    const { authHeaders } = await createAndLoginAdmin();
    const parent = await createTestSkill({ name: 'NestJS' });
    const child = await createTestSkill({
      name: 'Guards',
      parentSkillId: parent.id,
    });

    const response = await axios.patch(
      `/skills/${parent.id}`,
      {
        parentSkillId: child.id,
      },
      {
        headers: authHeaders,
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.message).toBe(
      'Circular parent-child relationship is not allowed',
    );
  });

  it('DELETE /skills/:id should return 403 for a non-admin user', async () => {
    const { authHeaders } = await registerAndLoginUser();
    const created = await createTestSkill({ name: 'NestJS' });

    const response = await axios.delete(`/skills/${created.id}`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(403);
    expect(response.data.message).toBe('Insufficient permissions');
  });

  it('DELETE /skills/:id should soft delete a skill for an admin', async () => {
    const { authHeaders } = await createAndLoginAdmin();
    const created = await createTestSkill({ name: 'NestJS' });

    const response = await axios.delete(`/skills/${created.id}`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(200);

    const getResponse = await axios.get(`/skills/${created.id}`, {
      headers: authHeaders,
    });
    expect(getResponse.status).toBe(404);
  });

  it('DELETE /skills/:id should return 400 if the skill has sub-skills', async () => {
    const { authHeaders } = await createAndLoginAdmin();
    const parent = await createTestSkill({ name: 'NestJS' });
    await createTestSkill({
      name: 'Guards',
      parentSkillId: parent.id,
    });

    const response = await axios.delete(`/skills/${parent.id}`, {
      headers: authHeaders,
    });

    expect(response.status).toBe(400);
    expect(response.data.message).toBe(
      'Cannot delete a skill that has sub-skills',
    );
  });

  it('PATCH /skills/:id/restore should return 403 for a non-admin user', async () => {
    const { authHeaders: adminHeaders } = await createAndLoginAdmin();
    const { authHeaders } = await registerAndLoginUser();
    const created = await createTestSkill({ name: 'NestJS' });

    await axios.delete(`/skills/${created.id}`, {
      headers: adminHeaders,
    });

    const response = await axios.patch(
      `/skills/${created.id}/restore`,
      {},
      {
        headers: authHeaders,
      },
    );

    expect(response.status).toBe(403);
    expect(response.data.message).toBe('Insufficient permissions');
  });

  it('PATCH /skills/:id/restore should restore a soft-deleted skill for an admin', async () => {
    const { authHeaders } = await createAndLoginAdmin();
    const created = await createTestSkill({ name: 'NestJS' });

    await axios.delete(`/skills/${created.id}`, {
      headers: authHeaders,
    });

    const response = await axios.patch(
      `/skills/${created.id}/restore`,
      {},
      {
        headers: authHeaders,
      },
    );

    expect(response.status).toBe(200);
    expect(response.data.id).toBe(created.id);

    const getResponse = await axios.get(`/skills/${created.id}`, {
      headers: authHeaders,
    });
    expect(getResponse.status).toBe(200);
  }, 15000);

  it('PATCH /skills/:id/restore should return 400 if parent is deleted', async () => {
    const { authHeaders } = await createAndLoginAdmin();
    const parent = await createTestSkill({ name: 'NestJS' });
    const child = await createTestSkill({
      name: 'Guards',
      parentSkillId: parent.id,
    });

    await axios.delete(`/skills/${child.id}`, {
      headers: authHeaders,
    });
    await axios.delete(`/skills/${parent.id}`, {
      headers: authHeaders,
    });

    const response = await axios.patch(
      `/skills/${child.id}/restore`,
      {},
      {
        headers: authHeaders,
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.message).toBe(
      'Cannot restore a skill whose parent does not exist or is deleted',
    );
  });

  it('POST /skills should return deletedSkillId if a deleted skill with the same name already exists at the same level', async () => {
    const { authHeaders } = await createAndLoginAdmin();
    const created = await createTestSkill({ name: 'NestJS' });

    await axios.delete(`/skills/${created.id}`, {
      headers: authHeaders,
    });

    const response = await axios.post(
      '/skills',
      {
        name: 'NestJS',
      },
      {
        headers: authHeaders,
      },
    );

    expect(response.status).toBe(400);
    expect(response.data.message).toBe(
      'A deleted skill with this name already exists at the same level. Restore it instead.',
    );
    expect(response.data.deletedSkillId).toBe(created.id);
  });
});
