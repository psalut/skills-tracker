import { expect, test } from '@playwright/test';
import { defaultUser, mockAuthenticatedSession, mockUserSkills } from './support/mocks';

test.describe('profile', () => {
  test('renders the current session details for authenticated users', async ({
    page,
  }) => {
    await mockAuthenticatedSession(page, { user: defaultUser });
    await mockUserSkills(page, []);

    await page.goto('/profile');

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Pablo' })).toBeVisible();
    await expect(page.getByText('Status: authenticated')).toBeVisible();
    await expect(page.getByText(defaultUser.email)).toBeVisible();
    await expect(page.getByText(defaultUser.id)).toBeVisible();
  });
});
