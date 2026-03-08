import axios from 'axios';
import { resetDatabase } from '../support/reset-database';

describe('Skills API (e2e)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('POST /skills should create a root skill', async () => {
    const response = await axios.post('/skills', {
      name: 'NestJS',
      description: 'Node.js framework',
    });

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      name: 'NestJS',
      description: 'Node.js framework',
      parentSkillId: null,
    });
    expect(response.data.id).toEqual(expect.any(String));
  });

  it('POST /skills should create a sub-skill', async () => {
    const parentResponse = await axios.post('/skills', {
      name: 'NestJS',
    });

    expect(parentResponse.status).toBe(201);
    expect(parentResponse.data).toHaveProperty('id');

    const parentId = parentResponse.data.id;

    const parentGetResponse = await axios.get(`/skills/${parentId}`);
    expect(parentGetResponse.status).toBe(200);

    const response = await axios.post('/skills', {
      name: 'Guards',
      parentSkillId: parentId,
    });

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      name: 'Guards',
      parentSkillId: parentId,
    });
  });

  it('POST /skills should return 404 if parent skill does not exist', async () => {
    const response = await axios.post('/skills', {
      name: 'Guards',
      parentSkillId: 'non-existing-id',
    });

    expect(response.status).toBe(404);
    expect(response.data.message).toBe('Parent skill not found');
  });

  it('GET /skills should return only non-deleted skills', async () => {
    const created = await axios.post('/skills', {
      name: 'NestJS',
    });

    await axios.delete(`/skills/${created.data.id}`);

    const response = await axios.get('/skills');

    expect(response.status).toBe(200);
    expect(response.data).toEqual([]);
  });

  it('GET /skills/roots should return only root skills', async () => {
    const parent = await axios.post('/skills', {
      name: 'NestJS',
    });

    await axios.post('/skills', {
      name: 'Guards',
      parentSkillId: parent.data.id,
    });

    const response = await axios.get('/skills/roots');

    expect(response.status).toBe(200);
    expect(response.data).toHaveLength(1);
    expect(response.data[0].name).toBe('NestJS');
  });

  it('GET /skills/:id should return a skill', async () => {
    const created = await axios.post('/skills', {
      name: 'NestJS',
    });

    const response = await axios.get(`/skills/${created.data.id}`);

    expect(response.status).toBe(200);
    expect(response.data.name).toBe('NestJS');
  });

  it('PATCH /skills/:id should update a skill', async () => {
    const created = await axios.post('/skills', {
      name: 'NestJS',
    });

    const response = await axios.patch(`/skills/${created.data.id}`, {
      description: 'Backend framework',
    });

    expect(response.status).toBe(200);
    expect(response.data.description).toBe('Backend framework');
  });

  it('PATCH /skills/:id should return 400 when a skill is its own parent', async () => {
    const created = await axios.post('/skills', {
      name: 'NestJS',
    });

    const response = await axios.patch(`/skills/${created.data.id}`, {
      parentSkillId: created.data.id,
    });

    expect(response.status).toBe(400);
    expect(response.data.message).toBe('A skill cannot be its own parent');
  });

  it('PATCH /skills/:id should return 400 when trying to create a circular relation', async () => {
    const parent = await axios.post('/skills', {
      name: 'NestJS',
    });

    const child = await axios.post('/skills', {
      name: 'Guards',
      parentSkillId: parent.data.id,
    });

    const response = await axios.patch(`/skills/${parent.data.id}`, {
      parentSkillId: child.data.id,
    });

    expect(response.status).toBe(400);
    expect(response.data.message).toBe(
      'Circular parent-child relationship is not allowed',
    );
  });

  it('DELETE /skills/:id should soft delete a skill', async () => {
    const created = await axios.post('/skills', {
      name: 'NestJS',
    });

    const response = await axios.delete(`/skills/${created.data.id}`);

    expect(response.status).toBe(200);

    const getResponse = await axios.get(`/skills/${created.data.id}`);
    expect(getResponse.status).toBe(404);
  });

  it('DELETE /skills/:id should return 400 if the skill has sub-skills', async () => {
    const parent = await axios.post('/skills', {
      name: 'NestJS',
    });

    await axios.post('/skills', {
      name: 'Guards',
      parentSkillId: parent.data.id,
    });

    const response = await axios.delete(`/skills/${parent.data.id}`);

    expect(response.status).toBe(400);
    expect(response.data.message).toBe(
      'Cannot delete a skill that has sub-skills',
    );
  });

  it('PATCH /skills/:id/restore should restore a soft-deleted skill', async () => {
    const created = await axios.post('/skills', {
      name: 'NestJS',
    });

    await axios.delete(`/skills/${created.data.id}`);

    const response = await axios.patch(`/skills/${created.data.id}/restore`);

    expect(response.status).toBe(200);
    expect(response.data.id).toBe(created.data.id);

    const getResponse = await axios.get(`/skills/${created.data.id}`);
    expect(getResponse.status).toBe(200);
  }, 15000);

  it('PATCH /skills/:id/restore should return 400 if parent is deleted', async () => {
    const parent = await axios.post('/skills', {
      name: 'NestJS',
    });

    const child = await axios.post('/skills', {
      name: 'Guards',
      parentSkillId: parent.data.id,
    });

    await axios.delete(`/skills/${child.data.id}`);
    await axios.delete(`/skills/${parent.data.id}`);

    const response = await axios.patch(`/skills/${child.data.id}/restore`);

    expect(response.status).toBe(400);
    expect(response.data.message).toBe(
      'Cannot restore a skill whose parent does not exist or is deleted',
    );
  });

  it('POST /skills should return deletedSkillId if a deleted skill with the same name already exists at the same level', async () => {
    const created = await axios.post('/skills', {
      name: 'NestJS',
    });

    await axios.delete(`/skills/${created.data.id}`);

    const response = await axios.post('/skills', {
      name: 'NestJS',
    });

    expect(response.status).toBe(400);
    expect(response.data.message).toBe(
      'A deleted skill with this name already exists at the same level. Restore it instead.',
    );
    expect(response.data.deletedSkillId).toBe(created.data.id);
  });
});
