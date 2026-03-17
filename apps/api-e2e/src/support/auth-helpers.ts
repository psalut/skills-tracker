import { UserRole } from '@prisma/client';
import axios from 'axios';
import { createTestUser } from './factories/user.factory';

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function registerAndLoginUser(overrides?: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}) {
  const password = overrides?.password ?? '12345678';
  const email = overrides?.email ?? `user-${uniqueSuffix()}@mail.com`;

  const registerResponse = await axios.post('/auth/register', {
    email,
    password,
    firstName: overrides?.firstName ?? 'User',
    lastName: overrides?.lastName ?? 'E2E',
  });

  const loginResponse = await axios.post('/auth/login', {
    email,
    password,
  });

  return {
    user: registerResponse.data,
    accessToken: loginResponse.data.accessToken,
    authHeaders: {
      Authorization: `Bearer ${loginResponse.data.accessToken}`,
    },
  };
}

export async function createAndLoginAdmin(overrides?: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}) {
  const password = overrides?.password ?? '12345678';
  const user = await createTestUser({
    email: overrides?.email ?? `admin-${uniqueSuffix()}@mail.com`,
    password,
    firstName: overrides?.firstName ?? 'Admin',
    lastName: overrides?.lastName ?? 'E2E',
    role: UserRole.ADMIN,
  });

  const loginResponse = await axios.post('/auth/login', {
    email: user.email,
    password,
  });

  return {
    user,
    accessToken: loginResponse.data.accessToken,
    authHeaders: {
      Authorization: `Bearer ${loginResponse.data.accessToken}`,
    },
  };
}
