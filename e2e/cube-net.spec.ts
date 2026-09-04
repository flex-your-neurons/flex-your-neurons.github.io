/**
 * Cube net — a flat net and five cubes, one of which folds from it.
 *
 * The seeded answer is known in Node, so the test can check the page draws the same net, offers the
 * same cubes, and calls the right one right. What would quietly break this format is the option
 * renderer: a cube drawn with left and right swapped would turn every mirror distractor into the
 * answer, so the faces are read back from the SVG.
 */
import { expect, test } from '@playwright/test';
import { expectedItem, practiceUrl } from './helpers';

const SEED = 'CUBEE2E1';

test.describe('cube net', () => {
  test('draws the seeded net and cubes, and scores the folded one right', async ({ page }) => {
    const item = expectedItem('cube-net', SEED, 0, 3);
    if (item.stimulus.kind !== 'cube-net') throw new Error('unexpected stimulus');
    await page.goto(practiceUrl('cube-net', { seed: SEED, difficulty: 3, length: 1 }));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');

    await expect(page.locator('[data-stimulus="cube-net"] [data-net-cell]')).toHaveCount(6);
    const cubes = page.locator('.option-figure--cube svg[data-cube]');
    await expect(cubes).toHaveCount(5);
    for (const [i, option] of item.options.entries()) {
      if (option.kind !== 'cube') throw new Error('unexpected option');
      await expect(cubes.nth(i)).toHaveAttribute('data-cube', option.faces.join('/'));
    }

    await page.getByTestId(`option-${item.answerIndex}`).click();
    await expect(page.getByTestId('verdict')).toHaveText(/Correct|Juste/);
  });

  test('names a mirror-handed cube as a mirror', async ({ page }) => {
    const item = expectedItem('cube-net', SEED, 0, 5);
    const mirror = item.errorTypes.indexOf('mirror');
    expect(mirror).toBeGreaterThanOrEqual(0);
    await page.goto(practiceUrl('cube-net', { seed: SEED, difficulty: 5, length: 1 }));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    await page.getByTestId(`option-${mirror}`).click();
    await expect(page.getByTestId('verdict')).not.toHaveText(/^Correct$/);
    await expect(page.getByTestId('feedback')).toContainText(/mirror|miroir/i);
  });
});
