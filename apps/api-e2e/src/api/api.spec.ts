import axios from 'axios';

describe('Users API (e2e)', () => {
  let userId: string;

  it('POST /users should create a user', async () => {
    const res = await axios.post('/users', {
      email: 'e2e-user@mail.com',
      password: '12345678',
      firstName: 'E2E',
      lastName: 'Test',
    });

    expect(res.status).toBe(201);

    expect(res.data).toHaveProperty('id');
    expect(res.data.email).toBe('e2e-user@mail.com');
    expect(res.data.firstName).toBe('E2E');
    expect(res.data.lastName).toBe('Test');

    expect(res.data.password).toBeUndefined();

    userId = res.data.id;
  });

  it('POST /users should reject duplicate email', async () => {
    try {
      await axios.post('/users', {
        email: 'e2e-user@mail.com',
        password: '12345678',
        firstName: 'E2E',
        lastName: 'Test',
      });
    } catch (err: any) {
      expect(err.response.status).toBe(409);
    }
  });

  it('GET /users should return list', async () => {
    const res = await axios.get('/users');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('GET /users/:id should return created user', async () => {
    const res = await axios.get(`/users/${userId}`);

    expect(res.status).toBe(200);
    expect(res.data.id).toBe(userId);
  });

  it('PATCH /users/:id should update user', async () => {
    const res = await axios.patch(`/users/${userId}`, {
      firstName: 'Updated',
    });

    expect(res.status).toBe(200);
    expect(res.data.firstName).toBe('Updated');
  });

  it('GET /users/:id should return 404 for missing user', async () => {
    try {
      await axios.get('/users/non-existing-id');
    } catch (err: any) {
      expect(err.response.status).toBe(404);
    }
  });

  it('POST /users should fail validation', async () => {
    try {
      await axios.post('/users', {
        email: 'invalid',
        password: '123',
      });
    } catch (err: any) {
      expect(err.response.status).toBe(400);
    }
  });
});