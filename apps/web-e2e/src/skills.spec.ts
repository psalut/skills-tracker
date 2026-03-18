import { expect, test } from '@playwright/test';
import {
  createSkill,
  createUserSkill,
  mockAuthenticatedSession,
  mockSkills,
  mockUserSkills,
} from './support/mocks';

test.describe('skills catalog', () => {
  test('filters skills and adds one to the tracked list', async ({ page }) => {
    const angular = createSkill('Angular');
    const docker = createSkill('Docker', {
      category: 'DEVOPS',
      isActive: false,
    });
    const english = createSkill('English', {
      category: 'LANGUAGE',
      description: 'Language practice',
    });

    await mockAuthenticatedSession(page);
    await mockSkills(page, [angular, docker, english]);
    await mockUserSkills(page, [createUserSkill(angular, 'INTERMEDIATE')]);

    await page.route('http://localhost:3000/user-skills', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON() as { skillId: string };

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(
            createUserSkill(
              payload.skillId === docker.id ? docker : english,
              null,
            ),
          ),
        });
        return;
      }

      await route.fallback();
    });

    await page.goto('/skills');

    await expect(
      page.getByRole('heading', { level: 1, name: 'Browse the skill map.' }),
    ).toBeVisible();
    await expect(page.getByText('3 results')).toBeVisible();

    await page.getByLabel('Search').fill('dock');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Docker' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Angular' }),
    ).not.toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await page.locator('#skills-category').selectOption('LANGUAGE');
    await expect(
      page.getByRole('heading', { level: 2, name: 'English' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Docker' }),
    ).not.toBeVisible();

    await page.locator('#skills-category').selectOption('ALL');
    await page.getByLabel('Status').selectOption('INACTIVE');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Docker' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 2, name: 'English' }),
    ).not.toBeVisible();

    await page.getByRole('button', { name: 'Clear filters' }).click();
    const dockerCard = page.locator('.skills__card', {
      has: page.getByRole('heading', { level: 2, name: 'Docker' }),
    });
    await dockerCard.getByRole('button', { name: 'Add to my skills' }).click();
    await expect(
      dockerCard.getByRole('button', { name: 'Added to my skills' }),
    ).toBeDisabled();
  });
});
