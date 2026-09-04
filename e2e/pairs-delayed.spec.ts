/**
 * The delayed probe: a paired-associates drill of n sets runs 2n items, the second half asking each
 * set again on a different box. The probe items are regenerated from the source seeds, so the test
 * knows every answer in advance.
 */
import { expect, test } from '@playwright/test';
import { deriveSeed } from '../src/lib/rng';
import { generateItem } from '../src/lib/generators';
import { expectedItem, practiceUrl, answerCorrectly } from './helpers';

const SEED = 'PDE2E001';
const OPTS = { seed: SEED, difficulty: 1 as const, length: 2 };

test.describe('delayed recall', () => {
  test('a paired-associates drill appends one delayed probe per set, seeded from the source', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(practiceUrl('paired-associates', OPTS));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    await expect(page.getByTestId('progress-label')).toHaveText('1 of 4');

    for (let i = 0; i < 2; i++) {
      await expect(page.getByTestId('quiz')).toHaveAttribute('data-item-type', 'paired-associates');
      await answerCorrectly(page, 'paired-associates', OPTS, i);
      await page.getByTestId('next').click();
    }

    for (let k = 0; k < 2; k++) {
      await expect(page.getByTestId('quiz')).toHaveAttribute('data-item-type', 'pairs-delayed');
      await expect(page.getByTestId('progress-label')).toHaveText(`${3 + k} of 4`);
      const source = expectedItem('paired-associates', SEED, k, 1);
      const probe = generateItem('pairs-delayed', deriveSeed(SEED, 'paired-associates', k), 1);
      if (source.stimulus.kind !== 'pairs' || probe.stimulus.kind !== 'pairs-delayed') throw new Error('unexpected stimuli');
      expect(probe.stimulus.probe).not.toBe(source.stimulus.probe);
      // No learning phase: the board opens straight on the question, boxes closed.
      const board = page.getByTestId('pairs-board');
      await expect(board).toHaveAttribute('data-pairs-delayed', 'true');
      await expect(board).toHaveAttribute('data-pairs-phase', 'probe');
      await expect(page.locator('[data-pairs-open="true"]')).toHaveCount(0);
      await page.getByTestId(`pairs-box-${probe.stimulus.probe + 1}`).click();
      await expect(page.getByTestId('feedback')).toHaveAttribute('data-correct', 'true');
      if (k === 0) await page.getByTestId('next').click();
    }
    await page.getByTestId('next').click();
    await expect(page.getByTestId('results')).toBeVisible();
  });

  test('a test never schedules delayed probes', async ({ page }) => {
    await page.goto('en/test/?seed=PDE2E001&n=2');
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    await expect(page.getByTestId('progress-label')).toHaveText('1 of 2');
  });
});
