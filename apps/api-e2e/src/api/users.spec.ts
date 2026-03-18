import axios from 'axios';
import {
  createAndLoginAdmin,
  registerAndLoginUser,
} from '../support/auth-helpers';
import { resetDatabase } from '../support/reset-database';

describe('Users API (e2e)', () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  it('GET /users should reject missing token', async () => {
    const res = await axios.get('/users');

    expect(res.status).toBe(401);
  });

  it('GET /users should return 403 for a non-admin user', async () => {
    const { authHeaders } = await registerAndLoginUser();

    const res = await axios.get('/users', {
      headers: authHeaders,
    });

    expect(res.status).toBe(403);
    expect(res.data.message).toBe('Insufficient permissions');
  });

  it('GET /users should return list for an admin', async () => {
    const { authHeaders } = await createAndLoginAdmin();

    const res = await axios.get('/users', {
      headers: authHeaders,
    });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('GET /users/:id should return the current user profile', async () => {
    const { user, authHeaders } = await registerAndLoginUser();

    const res = await axios.get(`/users/${user.id}`, {
      headers: authHeaders,
    });

    expect(res.status).toBe(200);
    expect(res.data.id).toBe(user.id);
    expect(res.data.email).toBe(user.email);
  });

  it('PATCH /users/:id should update the current user profile', async () => {
    const { user, authHeaders } = await registerAndLoginUser();

    const res = await axios.patch(
      `/users/${user.id}`,
      { firstName: 'Updated' },
      {
        headers: authHeaders,
      },
    );

    expect(res.status).toBe(200);
    expect(res.data.id).toBe(user.id);
    expect(res.data.firstName).toBe('Updated');
  });

  it('GET /users/:id should return 403 for another non-admin user', async () => {
    const { authHeaders } = await registerAndLoginUser();
    const { user: otherUser } = await registerAndLoginUser();

    const res = await axios.get(`/users/${otherUser.id}`, {
      headers: authHeaders,
    });

    expect(res.status).toBe(403);
    expect(res.data.message).toBe('You can only access your own profile');
  });

  it('PATCH /users/:id should return 403 for another non-admin user', async () => {
    const { authHeaders } = await registerAndLoginUser();
    const { user: otherUser } = await registerAndLoginUser();

    const res = await axios.patch(
      `/users/${otherUser.id}`,
      { firstName: 'Blocked' },
      {
        headers: authHeaders,
      },
    );

    expect(res.status).toBe(403);
    expect(res.data.message).toBe('You can only access your own profile');
  });

  it('GET /users/:id should allow admins to read another user profile', async () => {
    const { authHeaders } = await createAndLoginAdmin();
    const { user } = await registerAndLoginUser();

    const res = await axios.get(`/users/${user.id}`, {
      headers: authHeaders,
    });

    expect(res.status).toBe(200);
    expect(res.data.id).toBe(user.id);
  });

  it('GET /users/:id should return 404 for a missing user when authorized', async () => {
    const { authHeaders } = await createAndLoginAdmin();

    const res = await axios.get('/users/non-existing-id', {
      headers: authHeaders,
    });

    expect(res.status).toBe(404);
  });
});
