/**
 * Chimp test — the layout is shown untimed, goes at the first tap, and is tapped back in order.
 *
 * The regressions that matter are absences: a numeral surviving the mask, or the tapped cells staying
 * marked during recall. Either would make the task easier than it says. The one thing the board does
 * show is a fading mark on the tap that just landed, so a reader can tell a registered tap from a
 * missed one; it carries the reader's own tap number, never the cell's hidden numeral.
 */
import { expect, test } from '@playwright/test';
import { expectedItem, practiceUrl } from './helpers';
import type { Difficulty } from '../src/lib/types';

const SEED = 'CHIMPE2E';
const url = (d: Difficulty) => practiceUrl('chimp-test', { seed: SEED, difficulty: d, length: 1 });

function cellsFor(difficulty: Difficulty): number[] {
  const item = expectedItem('chimp-test', SEED, 0, difficulty);
  if (item.stimulus.kind !== 'chimp') throw new Error('unexpected stimulus');
  return item.stimulus.cells;
}

test.describe('chimp test', () => {
  test('shows every numeral until the first tap, then masks them all', async ({ page }) => {
    await page.goto(url(1));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const cells = cellsFor(1);
    const board = page.getByTestId('chimp-board');
    await expect(board).toHaveAttribute('data-chimp-phase', 'study');
    for (const [i, cell] of cells.entries()) {
      await expect(page.getByTestId(`chimp-cell-${cell}`)).toHaveText(String(i + 1));
    }
    await expect(page.locator('.chimp-cell[data-chimp-numbered]')).toHaveCount(cells.length);

    await page.getByTestId(`chimp-cell-${cells[0]}`).click();
    await expect(board).toHaveAttribute('data-chimp-phase', 'recall');
    await expect(page.locator('.chimp-cell[data-chimp-numbered]')).toHaveCount(0);
    await expect(page.locator('.chimp-numeral')).toHaveCount(0);
    // No running tally of which cells have been tapped.
    await expect(page.locator('.chimp-cell[data-chimp-tapped]')).toHaveCount(0);
    await expect(page.getByTestId('chimp-count')).toContainText('1 of');
  });

  test('marks the tap that just landed, and only that one', async ({ page }) => {
    await page.goto(url(3));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const cells = cellsFor(3);
    const board = page.getByTestId('chimp-board');

    for (const [i, cell] of cells.slice(0, -1).entries()) {
      await page.getByTestId(`chimp-cell-${cell}`).click();
      // The mark is on the cell that was tapped, and says which tap it was.
      const echo = page.locator('.chimp-cell[data-chimp-echo] .chimp-echo');
      await expect(echo).toHaveCount(1);
      await expect(echo).toHaveText(String(i + 1));
      await expect(page.getByTestId(`chimp-cell-${cell}`)).toHaveAttribute('data-chimp-echo', String(i + 1));
      // It never reports the cell's hidden numeral, so it cannot be read as a verdict.
      await expect(page.locator('.chimp-numeral')).toHaveCount(0);
      await expect(board).toHaveAttribute('data-chimp-taps', String(i + 1));
    }

    // And it goes: the mark is a confirmation, not a record of where the reader has been.
    await expect
      .poll(() => page.locator('.chimp-echo').evaluate((el) => getComputedStyle(el).opacity))
      .toBe('0');
  });

  test('taps a cell twice and marks it as the later tap', async ({ page }) => {
    await page.goto(url(3));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const cell = page.getByTestId(`chimp-cell-${cellsFor(3)[0]}`);
    await cell.click();
    await expect(cell).toHaveAttribute('data-chimp-echo', '1');
    await cell.click();
    await expect(cell).toHaveAttribute('data-chimp-echo', '2');
    await expect(page.locator('.chimp-cell[data-chimp-echo]')).toHaveCount(1);
  });

  test('drops the mark once the numerals are back', async ({ page }) => {
    await page.goto(url(1));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const cells = cellsFor(1);
    for (const cell of cells) await page.getByTestId(`chimp-cell-${cell}`).click();
    await expect(page.getByTestId('verdict')).toBeVisible();
    // Otherwise the last cell would carry two different numbers at once.
    await expect(page.locator('.chimp-cell[data-chimp-echo]')).toHaveCount(0);
  });

  test('accepts the numerals in order and scores it correct', async ({ page }) => {
    await page.goto(url(2));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const cells = cellsFor(2);
    for (const cell of cells) await page.getByTestId(`chimp-cell-${cell}`).click();
    await expect(page.getByTestId('verdict')).toHaveText('Correct');
    // The reveal brings the numerals back.
    await expect(page.locator('.chimp-cell[data-chimp-answer]')).toHaveCount(cells.length);
    await expect(page.locator('.chimp-cell[data-chimp-wrong]')).toHaveCount(0);
  });

  test('marks where a wrong tap went, and names a swapped pair as a lost order', async ({ page }) => {
    await page.goto(url(1));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const cells = cellsFor(1);
    const order = [...cells];
    const n = order.length;
    [order[n - 2], order[n - 1]] = [order[n - 1]!, order[n - 2]!];
    for (const cell of order) await page.getByTestId(`chimp-cell-${cell}`).click();
    await expect(page.getByTestId('verdict')).not.toHaveText('Correct');
    await expect(page.locator('.chimp-cell[data-chimp-wrong]')).toHaveCount(2);
    await expect(page.getByTestId('feedback')).toContainText(/order/i);
  });
});
