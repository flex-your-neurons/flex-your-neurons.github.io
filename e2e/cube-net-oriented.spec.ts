/**
 * Oriented cube net — a flat net of marks with a top, and six cubes, one of which folds from it with
 * every mark the right way up.
 *
 * The turns are read back from the SVG: a renderer that dropped them would turn the wrong-turn
 * distractor into a second answer, and one that reflected a face would make every option a lie.
 */
import { expect, test } from '@playwright/test';
import { expectedItem, practiceUrl } from './helpers';

const SEED = 'OCUBEE2E';

test.describe('oriented cube net', () => {
  test('draws the seeded net and turned cubes, and scores the folded one right', async ({ page }) => {
    const item = expectedItem('cube-net-oriented', SEED, 0, 3);
    if (item.stimulus.kind !== 'cube-net') throw new Error('unexpected stimulus');
    await page.goto(practiceUrl('cube-net-oriented', { seed: SEED, difficulty: 3, length: 1 }));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');

    await expect(page.locator('[data-stimulus="cube-net"] [data-net-cell]')).toHaveCount(6);
    const cubes = page.locator('.option-figure--cube svg[data-cube]');
    await expect(cubes).toHaveCount(6);
    for (const [i, option] of item.options.entries()) {
      if (option.kind !== 'cube') throw new Error('unexpected option');
      await expect(cubes.nth(i)).toHaveAttribute('data-cube', option.faces.join('/'));
      await expect(cubes.nth(i)).toHaveAttribute('data-turns', option.turns!.join(''));
    }

    await page.getByTestId(`option-${item.answerIndex}`).click();
    await expect(page.getByTestId('verdict')).toHaveText(/Correct|Juste/);
  });

  test('names a turned mark as turned', async ({ page }) => {
    const item = expectedItem('cube-net-oriented', SEED, 0, 2);
    const turned = item.errorTypes.indexOf('wrong-turn');
    expect(turned).toBeGreaterThanOrEqual(0);
    await page.goto(practiceUrl('cube-net-oriented', { seed: SEED, difficulty: 2, length: 1 }));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    await page.getByTestId(`option-${turned}`).click();
    await expect(page.getByTestId('verdict')).not.toHaveText(/^Correct$/);
    await expect(page.getByTestId('feedback')).toContainText(/turned|tournée/i);
  });
});
