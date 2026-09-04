/**
 * Go / no-go — a run that plays itself and records what was pressed.
 *
 * What would quietly break this format is not a layout bug but a scoring one: a press on a crossed
 * signal being ignored (which would make every run a pass), or a run that stopped at the first
 * mistake (which would make the record a single trial). Both are checked here from the seed, since
 * the run is a secret until it plays.
 */
import { expect, test } from '@playwright/test';
import { clearAppStorage, expectedItem, practiceUrl } from './helpers';
import type { Difficulty } from '../src/lib/types';

const SEED = 'GNGE2E01';
const url = (d: Difficulty) => practiceUrl('go-no-go', { seed: SEED, difficulty: d, length: 1 });

function signalsFor(difficulty: Difficulty): boolean[] {
  const item = expectedItem('go-no-go', SEED, 0, difficulty);
  if (item.stimulus.kind !== 'gonogo') throw new Error('unexpected stimulus');
  return item.stimulus.signals;
}

async function play(page: import('@playwright/test').Page, signals: boolean[], pressOn: (i: number) => boolean) {
  await page.getByTestId('span-start').click();
  const board = page.getByTestId('gonogo-board');
  await expect(board).toHaveAttribute('data-gonogo-phase', 'run');
  for (const [i] of signals.entries()) {
    await page.locator(`[data-testid="gonogo-board"][data-gonogo-index="${i}"]`).waitFor({ timeout: 30_000 });
    if (pressOn(i)) await page.getByTestId('gonogo-target').click();
  }
  await expect(board).toHaveAttribute('data-gonogo-phase', 'revealed', { timeout: 30_000 });
}

test.describe('go / no-go', () => {
  test('is inert behind its gate, then shows plain and crossed signals in the seeded order', async ({ page }) => {
    await page.goto(url(1));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const board = page.getByTestId('gonogo-board');
    await expect(board).toHaveAttribute('data-gonogo-phase', 'gate');
    await expect(page.getByTestId('gonogo-target')).toBeDisabled();

    const signals = signalsFor(1);
    await page.getByTestId('span-start').click();
    for (const [i, go] of signals.entries()) {
      await page.locator(`[data-testid="gonogo-board"][data-gonogo-index="${i}"]`).waitFor({ timeout: 30_000 });
      await expect(page.getByTestId('gonogo-target')).toHaveAttribute('data-gonogo-showing', go ? 'go' : 'stop');
    }
  });

  test('a perfect run is correct and reports a mean time', async ({ page }) => {
    await page.goto(url(2));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const signals = signalsFor(2);
    await play(page, signals, (i) => signals[i]!);
    await expect(page.getByTestId('gonogo-result')).toContainText('ms');
    await expect(page.getByTestId('verdict')).toHaveText(/Correct|Juste/);
  });

  test('a press on a crossed signal does not end the run, and is a commission', async ({ page }) => {
    await page.goto(url(1));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const signals = signalsFor(1);
    const firstStop = signals.indexOf(false);
    // Press everything up to and including the first crossed signal, and every plain one after it.
    await play(page, signals, (i) => i === firstStop || signals[i]!);
    await expect(page.getByTestId('verdict')).not.toHaveText(/^Correct$/);
    await expect(page.getByTestId('gonogo-result')).toContainText(/crossed|barré/);
    // The record shows every signal, so the run went to the end.
    await expect(page.locator('.gonogo-mark')).toHaveCount(signals.length);
    await expect(page.locator('.gonogo-mark[data-wrong]')).toHaveCount(1);
  });

  test('a plain signal left alone is an omission', async ({ page }) => {
    await page.goto(url(1));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    const signals = signalsFor(1);
    await play(page, signals, (i) => i !== 0 && signals[i]!);
    await expect(page.getByTestId('verdict')).not.toHaveText(/^Correct$/);
    await expect(page.getByTestId('gonogo-result')).toContainText(/plain|plein/);
  });

  /**
   * The read-out end to end: four runs, one of them a commission and one an omission, and the
   * progress page counts each by kind.
   */
  test('the progress page counts commissions and omissions by kind after four runs', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(url(1));
    await clearAppStorage(page);
    await page.goto('en/progress/');
    await expect(page.getByTestId('gt-section')).toHaveCount(0);
    await page.goto(practiceUrl('go-no-go', { seed: SEED, difficulty: 1, length: 4 }));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
    for (let i = 0; i < 4; i++) {
      const item = expectedItem('go-no-go', SEED, i, 1);
      if (item.stimulus.kind !== 'gonogo') throw new Error('unexpected stimulus');
      const signals = item.stimulus.signals;
      const firstStop = signals.indexOf(false);
      const pressOn =
        i === 1 ? (k: number) => k === firstStop || signals[k]! : i === 2 ? (k: number) => k !== 0 && signals[k]! : (k: number) => signals[k]!;
      await play(page, signals, pressOn);
      const next = page.getByTestId('next');
      if ((await next.count()) > 0) await next.click();
    }
    await page.goto('en/progress/');
    await expect(page.getByTestId('gt-section')).toBeVisible();
    await expect(page.getByTestId('stat-commissions')).toContainText('1');
    await expect(page.getByTestId('stat-omissions')).toContainText('1');
    await expect(page.getByTestId('stat-simple-rt')).toContainText('not yet');
  });
});
