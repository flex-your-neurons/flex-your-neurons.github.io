/**
 * Gear train — the drawing must show the seeded chain, and the scored option must be the one the
 * two rules give. The wrong-direction option is checked to be named as such.
 */
import { expect, test } from '@playwright/test';
import { expectedItem, practiceUrl } from './helpers';

const SEED = 'GEARE2E1';

test.describe('gear train', () => {
  test('draws the seeded wheels and belts, and scores the computed answer right', async ({ page }) => {
    const item = expectedItem('gear-train', SEED, 0, 4);
    if (item.stimulus.kind !== 'gears') throw new Error('unexpected stimulus');
    await page.goto(practiceUrl('gear-train', { seed: SEED, difficulty: 4, length: 1 }));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const svg = page.locator('[data-stimulus="gears"] svg');
    await expect(svg).toHaveAttribute('data-gears', item.stimulus.sizes.join(','));
    await expect(svg).toHaveAttribute('data-links', item.stimulus.links.join(','));
    await expect(svg).toHaveAttribute('data-driver', item.stimulus.driverClockwise ? 'clockwise' : 'anticlockwise');
    await expect(svg.locator('[data-wheel]')).toHaveCount(item.stimulus.sizes.length);
    const belts = item.stimulus.links.filter((l) => l !== 'mesh').length;
    await expect(svg.locator('[data-belt]')).toHaveCount(belts * 2);
    await page.getByTestId(`option-${item.answerIndex}`).click();
    await expect(page.getByTestId('verdict')).toHaveText(/Correct|Juste/);
  });

  test('names a reversed direction as the wrong direction', async ({ page }) => {
    const item = expectedItem('gear-train', SEED, 0, 2);
    const wrongWay = item.errorTypes.indexOf('wrong-direction');
    await page.goto(practiceUrl('gear-train', { seed: SEED, difficulty: 2, length: 1 }));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    await page.getByTestId(`option-${wrongWay}`).click();
    await expect(page.getByTestId('verdict')).not.toHaveText(/^Correct$/);
    await expect(page.getByTestId('feedback')).toContainText(/direction|sens/i);
  });
});
