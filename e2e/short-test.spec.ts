/**
 * The short test: seven items, one per domain, the format for each drawn from the seed.
 */
import { expect, test } from '@playwright/test';
import { DOMAIN_ORDER, getMeta, onePerDomain } from '../src/lib/generators';
import { dict } from '../src/lib/i18n';
import { answerCorrectly, clearAppStorage } from './helpers';

const SEED = 'SHORTE2E';

test.describe('short test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('en/');
    await clearAppStorage(page);
  });

  test('is seven items long and says so', async ({ page }) => {
    await page.goto('en/test/short/');
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    await expect(page.getByTestId('progress-label')).toHaveText(dict('en').quiz.progress(1, DOMAIN_ORDER.length));
    await expect(page.getByTestId('page-lede')).toContainText(String(DOMAIN_ORDER.length));
    await expect(page.getByTestId('link-full-test')).toBeVisible();
  });

  test('deals one format per domain from the seed, in domain order, and scores as a test', async ({ page }) => {
    test.setTimeout(300_000);
    const types = onePerDomain(SEED);
    expect(types.map((t) => getMeta(t).domain)).toEqual(DOMAIN_ORDER);
    await page.goto(`en/test/short/?seed=${SEED}&d=1`);
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    for (const [i, type] of types.entries()) {
      await expect(page.getByTestId('quiz')).toHaveAttribute('data-item-type', type);
      await answerCorrectly(page, type, { seed: SEED, difficulty: 1, length: types.length }, i);
      // A test withholds feedback: the next item follows at once.
    }
    await expect(page.getByTestId('results')).toBeVisible();
  });

  test('the full test links to it', async ({ page }) => {
    await page.goto('en/test/');
    await page.getByTestId('link-short-test').click();
    await expect(page).toHaveURL(/\/en\/test\/short\/$/);
  });
});
