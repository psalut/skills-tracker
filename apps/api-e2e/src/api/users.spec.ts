import axios from 'axios';

axios.defaults.baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3333';
axios.defaults.validateStatus = () => true;

describe('Users API (e2e)', () => {
  let userId: string;
  let accessToken: string;

  function authHeaders() {
    return {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  const email = 'e2e-user@mail.com';
  const password = '12345678';

  beforeAll(async () => {
    const registerRes = await axios.post('/auth/register', {
      email,
      password,
      firstName: 'Users',
      lastName: 'E2E',
    });

    expect(registerRes.status).toBe(201);
    userId = registerRes.data.id;

    const loginRes = await axios.post('/auth/login', {
      email,
      password,
    });

    expect(loginRes.status).toBe(201);
    expect(loginRes.data).toHaveProperty('accessToken');

    accessToken = loginRes.data.accessToken;
  });

  it('GET /users should reject missing token', async () => {
    const res = await axios.get('/users');

    expect(res.status).toBe(401);
  });

  it('GET /users should return list', async () => {
    const res = await axios.get('/users', authHeaders());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('GET /users/:id should return created user', async () => {
    const res = await axios.get(`/users/${userId}`, authHeaders());

    expect(res.status).toBe(200);
    expect(res.data.id).toBe(userId);
    expect(res.data.email).toBe(email);
  });

  it('PATCH /users/:id should update user with valid token', async () => {
    const res = await axios.patch(
      `/users/${userId}`,
      { firstName: 'Updated' },
      authHeaders(),
    );

    expect(res.status).toBe(200);
    expect(res.data.id).toBe(userId);
    expect(res.data.firstName).toBe('Updated');
  });

  it('GET /users/:id should return 404 for missing user', async () => {
    const res = await axios.get('/users/non-existing-id', authHeaders());

    expect(res.status).toBe(404);
  });
});
