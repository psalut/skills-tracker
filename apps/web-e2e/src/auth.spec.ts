import { expect, test } from '@playwright/test';
import {
  defaultUser,
  mockAuthenticatedSession,
  mockCurrentUser,
  mockLogin,
  mockUserSkills,
} from './support/mocks';

test.describe('auth flows', () => {
  test('redirects anonymous users to login', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Sign in to continue tracking your progress.',
      }),
    ).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('signs in and redirects to dashboard', async ({ page }) => {
    await mockLogin(page);
    await mockCurrentUser(page, defaultUser);
    await mockUserSkills(page, []);

    await page.goto('/login');
    await page.getByLabel('Email').fill(defaultUser.email);
    await page.getByLabel('Password').fill('12345678');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your current learning status' }),
    ).toBeVisible();
    await expect(page.getByText('Pablo')).toBeVisible();
  });

  test('shows an authentication error for invalid credentials', async ({
    page,
  }) => {
    await mockLogin(page, {
      status: 401,
      body: { statusCode: 401, message: 'Unauthorized' },
    });

    await page.goto('/login');
    await page.getByLabel('Email').fill('pablo@mail.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });

  test('redirects authenticated users away from login', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await mockUserSkills(page, []);

    await page.goto('/login');

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your current learning status' }),
    ).toBeVisible();
  });
});
