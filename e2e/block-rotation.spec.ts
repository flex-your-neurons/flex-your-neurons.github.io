/**
 * Block rotation — an object and four more, one of them the object turned.
 *
 * The page must draw the seeded objects (read back from the SVG's data attribute) and score the
 * rotation right and the mirror image wrong, naming it a mirror.
 */
import { expect, test } from '@playwright/test';
import { answerCorrectly, clearAppStorage, expectedItem, practiceUrl } from './helpers';

const SEED = 'BLOCKE2E';

test.describe('block rotation', () => {
  test('draws the seeded object and options, and scores the turned one right', async ({ page }) => {
    const item = expectedItem('block-rotation', SEED, 0, 2);
    if (item.stimulus.kind !== 'polycube') throw new Error('unexpected stimulus');
    await page.goto(practiceUrl('block-rotation', { seed: SEED, difficulty: 2, length: 1 }));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const key = (cubes: readonly (readonly number[])[]) => cubes.map((c) => c.join(',')).join(' ');
    await expect(page.locator('[data-stimulus="polycube"] svg[data-polycube]')).toHaveAttribute('data-polycube', key(item.stimulus.cubes));
    const options = page.locator('.option-figure--polycube svg[data-polycube]');
    await expect(options).toHaveCount(4);
    for (const [i, option] of item.options.entries()) {
      if (option.kind !== 'polycube') throw new Error('unexpected option');
      await expect(options.nth(i)).toHaveAttribute('data-polycube', key(option.cubes));
    }
    await page.getByTestId(`option-${item.answerIndex}`).click();
    await expect(page.getByTestId('verdict')).toHaveText(/Correct|Juste/);
  });

  test('names the mirror image as a mirror', async ({ page }) => {
    const item = expectedItem('block-rotation', SEED, 0, 4);
    const mirror = item.errorTypes.indexOf('mirror');
    expect(mirror).toBeGreaterThanOrEqual(0);
    await page.goto(practiceUrl('block-rotation', { seed: SEED, difficulty: 4, length: 1 }));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    await page.getByTestId(`option-${mirror}`).click();
    await expect(page.getByTestId('verdict')).not.toHaveText(/^Correct$/);
    await expect(page.getByTestId('feedback')).toContainText(/mirror|miroir/i);
  });

  test('the progress page reads a rotation baseline and slope off the levels', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('en/progress/');
    await clearAppStorage(page);
    await page.reload();
    await expect(page.getByTestId('gv-section')).toHaveCount(0);
    for (const difficulty of [1, 5] as const) {
      const opts = { seed: `BLOCKSLOPE${difficulty}`, difficulty, length: 5 };
      await page.goto(practiceUrl('block-rotation', opts));
      await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
      for (let i = 0; i < 5; i++) {
        await answerCorrectly(page, 'block-rotation', opts, i);
        await page.getByTestId('next').click();
      }
      await expect(page.getByTestId('results')).toBeVisible();
    }
    await page.goto('en/progress/');
    await expect(page.getByTestId('gv-section')).toBeVisible();
    await expect(page.getByTestId('stat-rotation-base')).toContainText(/\d/);
    await expect(page.getByTestId('stat-rotation-slope')).toContainText(/ms/);
  });
});
