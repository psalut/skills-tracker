import axios from 'axios';

axios.defaults.baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3333';
axios.defaults.validateStatus = () => true;

describe('Users API (e2e)', () => {
  let userId: string;
  const email = 'e2e-user@mail.com';

  beforeAll(async () => {
    // La DB ya debería estar limpia por global-setup (resetDatabase()).
    // Creamos el usuario base de la suite acá para que el resto de tests no dependan del orden.
    const res = await axios.post('/users', {
      email,
      password: '12345678',
      firstName: 'E2E',
      lastName: 'Test',
    });

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty('id');
    expect(res.data.email).toBe(email);
    expect(res.data.firstName).toBe('E2E');
    expect(res.data.lastName).toBe('Test');
    expect(res.data.password).toBeUndefined();

    userId = res.data.id;
  });

  it('POST /users should reject duplicate email', async () => {
    const res = await axios.post('/users', {
      email,
      password: '12345678',
      firstName: 'E2E',
      lastName: 'Test',
    });

    expect(res.status).toBe(409);
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
    expect(res.data.email).toBe(email);
  });

  it('PATCH /users/:id should update user', async () => {
    const res = await axios.patch(`/users/${userId}`, {
      firstName: 'Updated',
    });

    expect(res.status).toBe(200);
    expect(res.data.id).toBe(userId);
    expect(res.data.firstName).toBe('Updated');
  });

  it('GET /users/:id should return 404 for missing user', async () => {
    const res = await axios.get('/users/non-existing-id');

    expect(res.status).toBe(404);
  });

  it('POST /users should fail validation', async () => {
    const res = await axios.post('/users', {
      email: 'invalid',
      password: '123',
    });

    expect(res.status).toBe(400);
  });
});
