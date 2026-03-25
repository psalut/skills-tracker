import { expect, test } from '@playwright/test';
import {
  createSkill,
  createUserSkill,
  mockAuthenticatedSession,
} from './support/mocks';

test.describe('dashboard', () => {
  test('renders stats and prioritized skill sections', async ({ page }) => {
    const angular = createSkill('Angular');
    const docker = createSkill('Docker', { category: 'DEVOPS' });
    const testing = createSkill('Testing', { category: 'TESTING' });

    await mockAuthenticatedSession(page);
    await page.route('**/user-skills', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          createUserSkill(angular, 'INTERMEDIATE'),
          createUserSkill(docker, 'BASIC'),
          createUserSkill(testing, 'EXPERT'),
        ]),
      });
    });

    await page.goto('/dashboard');

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Discover the shape of your current progress.',
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'What to push next' }),
    ).toBeVisible();
    await expect(page.getByText('Tracked skills')).toBeVisible();
    await expect(page.getByText('3').first()).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Needs attention' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Closest to mastery' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Angular' }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 3, name: 'Docker' }).first(),
    ).toBeVisible();
  });

  test('can retry after a dashboard load error', async ({ page }) => {
    await mockAuthenticatedSession(page);

    let requestCount = 0;
    await page.route('**/user-skills', async (route) => {
      requestCount += 1;

      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'server error' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          createUserSkill(createSkill('NestJS'), 'ADVANCED'),
        ]),
      });
    });

    await page.goto('/dashboard');

    await expect(
      page.getByText('Could not load your dashboard right now.'),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Retry' }).click();

    await expect(
      page.getByRole('heading', { level: 3, name: 'NestJS' }).first(),
    ).toBeVisible();
  });
});
