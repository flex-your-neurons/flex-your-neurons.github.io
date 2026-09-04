/**
 * Number line — a range input on a drawn line, graded by distance.
 *
 * What would quietly break this format is the grading: a strict comparison would make every estimate
 * wrong, and a missing tolerance would make every estimate right. Both directions are checked, and
 * the review's direction words are read back, since the sign of a miss is the whole review.
 */
import { expect, test } from '@playwright/test';
import { expectedItem, practiceUrl } from './helpers';

const SEED = 'LINEE2E1';

test.describe('number line', () => {
  test('a mark within tolerance is right, and the target is shown after', async ({ page }) => {
    const item = expectedItem('number-line', SEED, 0, 2);
    const target = Number(item.answerText);
    await page.goto(practiceUrl('number-line', { seed: SEED, difficulty: 2, length: 1 }));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    if (item.stimulus.kind !== 'number-line') throw new Error('unexpected stimulus');
    await expect(page.getByTestId('numline-value')).toHaveText(item.stimulus.label);
    // The button is inert until the mark has been moved.
    await expect(page.getByTestId('submit-numline')).toBeDisabled();
    await page.getByTestId('numline-input').fill(String(target + 20));
    await page.getByTestId('submit-numline').click();
    await expect(page.getByTestId('verdict')).toHaveText(/Correct|Juste/);
    await expect(page.getByTestId('numline-target')).toBeVisible();
    await expect(page.getByTestId('numline-result')).toContainText(/Within tolerance|On the mark/);
  });

  test('a mark far to the right is wrong, and the review says which way', async ({ page }) => {
    const item = expectedItem('number-line', SEED, 0, 1);
    const target = Number(item.answerText);
    await page.goto(practiceUrl('number-line', { seed: SEED, difficulty: 1, length: 1 }));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const wrong = target > 500 ? target - 200 : target + 200;
    await page.getByTestId('numline-input').fill(String(wrong));
    await page.getByTestId('submit-numline').click();
    await expect(page.getByTestId('verdict')).not.toHaveText(/^Correct$/);
    await expect(page.getByTestId('numline-result')).toContainText(wrong > target ? /Too far right/ : /Too far left/);
    await expect(page.getByTestId('numline-board')).toHaveAttribute('data-numline-position', String(wrong));
  });
});
