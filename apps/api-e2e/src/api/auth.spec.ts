import axios from 'axios';
import { resetDatabase } from '../support/reset-database';

describe('Auth API (e2e)', () => {
  const password = '12345678';

  beforeAll(async () => {
    await resetDatabase();
  });

  it('POST /auth/register should create a user', async () => {
    const email = `auth-register-${Date.now()}@mail.com`;

    const res = await axios.post('/auth/register', {
      email,
      password,
      firstName: 'Auth',
      lastName: 'E2E',
    });

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty('id');
    expect(res.data.email).toBe(email);
    expect(res.data.password).toBeUndefined();
  });

  it('POST /auth/register should reject duplicate email', async () => {
    const email = `auth-duplicate-${Date.now()}@mail.com`;

    await axios.post('/auth/register', {
      email,
      password,
      firstName: 'Auth',
      lastName: 'E2E',
    });

    const res = await axios.post('/auth/register', {
      email,
      password,
      firstName: 'Auth',
      lastName: 'E2E',
    });

    expect(res.status).toBe(409);
  });

  it('POST /auth/register should fail validation', async () => {
    const res = await axios.post('/auth/register', {
      email: 'invalid',
      password: '123',
    });

    expect(res.status).toBe(400);
  });

  it('POST /auth/login should return access token', async () => {
    const email = `auth-login-${Date.now()}@mail.com`;

    await axios.post('/auth/register', {
      email,
      password,
      firstName: 'Auth',
      lastName: 'E2E',
    });

    const res = await axios.post('/auth/login', {
      email,
      password,
    });

    expect(res.status).toBe(201);
    expect(res.data).toHaveProperty('accessToken');
    expect(typeof res.data.accessToken).toBe('string');
  });

  it('POST /auth/login should reject invalid credentials', async () => {
    const email = `auth-invalid-${Date.now()}@mail.com`;

    await axios.post('/auth/register', {
      email,
      password,
      firstName: 'Auth',
      lastName: 'E2E',
    });

    const res = await axios.post('/auth/login', {
      email,
      password: 'wrongpass',
    });

    expect(res.status).toBe(401);
  });

  it('GET /auth/me should return current user with valid token', async () => {
    const email = `auth-me-${Date.now()}@mail.com`;

    await axios.post('/auth/register', {
      email,
      password,
      firstName: 'Auth',
      lastName: 'E2E',
    });

    const loginRes = await axios.post('/auth/login', {
      email,
      password,
    });

    expect(loginRes.status).toBe(201);

    const token = loginRes.data.accessToken;

    const meRes = await axios.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(meRes.status).toBe(200);
    expect(meRes.data.email).toBe(email);
    expect(meRes.data.password).toBeUndefined();
  });

  it('GET /auth/me should reject missing token', async () => {
    const res = await axios.get('/auth/me');

    expect(res.status).toBe(401);
  });
});
