import { expect, type Page } from '@playwright/test';
import { generateItem } from '../src/lib/generators';
import { deriveSeed } from '../src/lib/rng';
import type { Locale } from '../src/lib/i18n';
import type { Difficulty, ItemTypeId } from '../src/lib/types';

/**
 * The tests import the generator directly, in Node, to work out what the *browser* should
 * be showing for a pinned seed. That makes them genuine end-to-end assertions rather than
 * "click something and hope": if the rendering, the seeding, the locale routing, or the
 * base path drifts, the expected answer index stops matching what the page marks correct.
 */
export function expectedItem(
  type: ItemTypeId,
  sessionSeed: string,
  index: number,
  difficulty: Difficulty,
  locale: Locale = 'en',
) {
  return generateItem(type, deriveSeed(sessionSeed, type, index), difficulty, locale);
}

export interface DrillOptions {
  seed: string;
  difficulty: Difficulty;
  length: number;
  /** Defaults to English; set to 'fr' to exercise the French routes. */
  locale?: Locale;
}

export function localeOf(opts: DrillOptions): Locale {
  return opts.locale ?? 'en';
}

/**
 * Relative on purpose: a leading slash would resolve against the origin and drop the base
 * path (see playwright.config.ts). Every page also carries a locale segment.
 */
export function practiceUrl(type: ItemTypeId, opts: DrillOptions): string {
  const { seed, difficulty, length } = opts;
  return `${localeOf(opts)}/practice/${type}/?seed=${seed}&d=${difficulty}&n=${length}`;
}

/** A locale-prefixed page path, e.g. `localePath('fr', 'progress/')`. */
export function localePath(locale: Locale, path = ''): string {
  return `${locale}/${path}`;
}

/**
 * Waits for the client-only quiz island to hydrate and render its first item.
 *
 * `data-hydrated` rather than mere visibility: the element is in the DOM one commit
 * before its effects run, and `page.keyboard.press` — unlike `click` — does not
 * auto-wait, so a key sent in that window is silently dropped.
 */
export async function waitForQuiz(page: Page): Promise<void> {
  await expect(page.getByTestId('quiz')).toBeVisible();
  await expect(page.getByTestId('quiz')).toHaveAttribute('data-hydrated', 'true');
}

/**
 * Starts playback if the current item is waiting on its gate.
 *
 * No transient format plays itself on mount — a reader who is still orienting would lose the
 * stream, and there is no replay — so every test that waits for playback has to press start first.
 *
 * `gated` is the fix for a race that was latent here for a long time. Without it the only way to ask
 * "is there a gate?" is `isVisible()`, which is a single sample rather than a wait: in a run that
 * advances straight from one item to the next, that sample can happen before the new item has
 * painted, the click is skipped, and the response controls stay locked until the test times out ten
 * minutes later. It surfaced when a fourth gated format shipped and the full-test run got long
 * enough to hit it, on head count, at item fourteen of eighteen.
 *
 * When the caller has the item in hand it knows the answer — `item.presentation !== undefined` is
 * exactly what "this plays before you can answer" means — so it can ask for a real auto-waiting
 * click instead of a guess. Callers that do not know the type keep the lenient behaviour.
 */
export async function startSpanIfGated(page: Page, gated?: boolean): Promise<void> {
  const start = page.getByTestId('span-start');
  if (gated) {
    await start.click({ timeout: 30_000 });
    return;
  }
  if (await start.isVisible().catch(() => false)) await start.click();
}

/**
 * Walks a trail board's path in order.
 *
 * A trail has no options and no expected string, so neither of the other two answering routes
 * applies: the item completes when the last target is clicked, and that is the only way to finish it.
 * `misclickFirst` deliberately taps a target out of turn first, which is counted against the run
 * without ending it — the only way to make a trail score as "not clean".
 */
async function walkTrail(
  page: Page,
  nodes: { label: string }[],
  misclickFirst: boolean,
): Promise<void> {
  if (misclickFirst && nodes.length > 1) {
    await page.getByTestId(`trail-node-${nodes.at(-1)!.label}`).click();
  }
  for (const node of nodes) {
    await page.getByTestId(`trail-node-${node.label}`).click();
  }
}

/**
 * Taps a block-span board's sequence back.
 *
 * The board plays itself before it will accept anything, so the wait is on the phase attribute
 * rather than on a timeout: playback is about a second per block and grows with difficulty, and a
 * fixed sleep would either be too short at level 5 or waste seconds at level 1.
 *
 * `reversed` is how a block-span item is answered *wrongly* on purpose. It is a genuine wrong answer
 * for every sequence this format produces — blocks never repeat, so a sequence can never read the
 * same in both directions — and it is a mistake with a name, which the diagnosis test relies on.
 */
async function tapBlocks(page: Page, sequence: number[], reversed: boolean): Promise<void> {
  const board = page.getByTestId('block-span-board');
  await expect(board).toHaveAttribute('data-block-phase', 'recall', { timeout: 30_000 });
  for (const index of reversed ? [...sequence].reverse() : sequence) {
    await page.getByTestId(`block-${index + 1}`).click();
  }
}

/**
 * Plays a reaction-time block: for each trial, waits for that trial's signal and presses the lit
 * target. `wrong` false-starts the first trial — presses during its wait — which is the diagnosis
 * this format names; the remaining trials are then played correctly, since the block goes on.
 */
async function pressReaction(page: Page, trials: { lit: number }[], wrong: boolean): Promise<void> {
  const board = page.getByTestId('reaction-board');
  await expect(board).toHaveAttribute('data-reaction-phase', 'wait', { timeout: 30_000 });
  for (const [i, trial] of trials.entries()) {
    if (wrong && i === 0) {
      await page.locator(`[data-testid="reaction-board"][data-reaction-trial="0"][data-reaction-phase="wait"]`).waitFor({ timeout: 30_000 });
      await page.getByTestId('reaction-target-1').click();
      continue;
    }
    await page
      .locator(`[data-testid="reaction-board"][data-reaction-trial="${i}"][data-reaction-phase="go"]`)
      .waitFor({ timeout: 30_000 });
    await page.getByTestId(`reaction-target-${trial.lit + 1}`).click();
  }
  // The last press opens a pause, and the block is only handed in when it ends. Wait for that, or a
  // caller reads the quiz before it has moved on: the board is revealed in practice, gone in a test.
  await page
    .locator('[data-testid="reaction-board"][data-reaction-phase="pause"]')
    .waitFor({ state: 'hidden', timeout: 30_000 });
}

/**
 * Places the mark on a number line. `wrong` lands a fifth of the line away, which is outside every
 * level's tolerance. Playwright's `fill` sets a range input's value and fires the input event.
 */
async function placeOnLine(page: Page, answerText: string, wrong: boolean): Promise<void> {
  const target = Number(answerText);
  const value = wrong ? (target > 500 ? target - 200 : target + 200) : target;
  await page.getByTestId('numline-input').fill(String(value));
  await page.getByTestId('submit-numline').click();
}

/**
 * Taps a chimp-test board: the 1 first, which masks the rest, then the others in order. `wrong` swaps
 * the last two taps, which is the transposition the diagnosis names.
 */
async function tapChimp(page: Page, cells: number[], wrong: boolean): Promise<void> {
  const board = page.getByTestId('chimp-board');
  await expect(board).toHaveAttribute('data-chimp-phase', 'study');
  const order = [...cells];
  if (wrong) {
    const n = order.length;
    [order[n - 2], order[n - 1]] = [order[n - 1]!, order[n - 2]!];
  }
  for (const cell of order) await page.getByTestId(`chimp-cell-${cell}`).click();
}

/**
 * Plays a go/no-go run. Each plain signal is pressed as soon as the board shows it; the crossed ones
 * are left alone. `wrong` presses on the first crossed signal as well — a commission, which is the
 * diagnosis this format exists to name.
 */
async function pressGoNoGo(page: Page, signals: boolean[], wrong: boolean): Promise<void> {
  const board = page.getByTestId('gonogo-board');
  await expect(board).toHaveAttribute('data-gonogo-phase', 'run', { timeout: 30_000 });
  let commissioned = false;
  for (const [i, go] of signals.entries()) {
    const shown = page.locator(`[data-testid="gonogo-board"][data-gonogo-index="${i}"]`);
    await shown.waitFor({ timeout: 30_000 });
    if (go || (wrong && !commissioned)) {
      await page.getByTestId('gonogo-target').click();
      if (!go) commissioned = true;
    }
  }
  // The run is handed in only when the last window and its gap have elapsed.
  await page
    .locator('[data-testid="gonogo-board"][data-gonogo-phase="run"]')
    .waitFor({ state: 'hidden', timeout: 30_000 });
}

/** Taps a pattern back. `wrong` swaps the last lit cell for an unlit neighbour of the grid. */
async function tapPattern(page: Page, size: number, cells: number[], wrong: boolean): Promise<void> {
  const board = page.getByTestId('pattern-board');
  await expect(board).toHaveAttribute('data-pattern-phase', 'recall', { timeout: 30_000 });
  const chosen = [...cells];
  if (wrong) {
    const unlit = Array.from({ length: size * size }, (_, i) => i).find((i) => !cells.includes(i))!;
    chosen[chosen.length - 1] = unlit;
  }
  for (const cell of chosen) await page.getByTestId(`pattern-cell-${cell}`).click();
}

/** Answers a paired-associates probe. `wrong` taps the box beside the right one. */
async function tapPairs(page: Page, boxes: number, probe: number, wrong: boolean): Promise<void> {
  const board = page.getByTestId('pairs-board');
  await expect(board).toHaveAttribute('data-pairs-phase', 'probe', { timeout: 60_000 });
  const index = wrong ? (probe === 0 ? 1 : probe - 1) : probe;
  void boxes;
  await page.getByTestId(`pairs-box-${index + 1}`).click();
}

/** Routes a `tap` item to the board that collects it. */
async function tapBoard(page: Page, item: ReturnType<typeof expectedItem>, wrong: boolean): Promise<void> {
  switch (item.stimulus.kind) {
    case 'block-span':
      return tapBlocks(page, item.stimulus.sequence, wrong);
    case 'reaction':
      return pressReaction(page, item.stimulus.trials, wrong);
    case 'gonogo':
      return pressGoNoGo(page, item.stimulus.signals, wrong);
    case 'chimp':
      return tapChimp(page, item.stimulus.cells, wrong);
    case 'number-line':
      return placeOnLine(page, item.answerText ?? '', wrong);
    case 'pattern':
      return tapPattern(page, item.stimulus.size, item.stimulus.cells, wrong);
    case 'pairs':
    case 'pairs-delayed':
      return tapPairs(page, item.stimulus.symbols.length, item.stimulus.probe, wrong);
    default:
      throw new Error(`no board for a tap item with stimulus ${item.stimulus.kind}`);
  }
}

/**
 * Fills a pyramid and submits it.
 *
 * `wrong` writes the right numbers with the last blank one out, which is a genuine wrong answer for
 * every pyramid this format produces and is also the *diagnosable* one — a single blank out by one
 * is what the fill diagnosis calls `off-by-one`, so the diagnosis tests get something to name.
 */
async function fillPyramid(page: Page, answerText: string, wrong: boolean): Promise<void> {
  const blanks = answerText.split(',');
  for (const [i, value] of blanks.entries()) {
    const last = i === blanks.length - 1;
    const typed = wrong && last ? String(Number(value) + 1) : value;
    await page.getByTestId(`pyramid-input-${i}`).fill(typed);
  }
  await page.getByTestId('submit-pyramid').click();
}

/** Answers the current item correctly, using the answer computed in Node. */
export async function answerCorrectly(
  page: Page,
  type: ItemTypeId,
  opts: DrillOptions,
  index: number,
): Promise<void> {
  const item = expectedItem(type, opts.seed, index, opts.difficulty, localeOf(opts));
  /*
   * Before the branch, not inside it: n-back is gated *and* answered by choice, so gating is
   * not a property of the response mode. Carrying a `presentation` is what gating *is*, so the
   * helper is told rather than left to guess — see the note on `startSpanIfGated`.
   */
  await startSpanIfGated(page, item.presentation !== undefined);
  if (item.responseMode === 'trail') {
    if (item.stimulus.kind !== 'trail') throw new Error('expected a trail stimulus');
    await walkTrail(page, item.stimulus.nodes, false);
    return;
  }
  if (item.responseMode === 'tap') {
    await tapBoard(page, item, false);
    return;
  }
  if (item.responseMode === 'fill') {
    await fillPyramid(page, item.answerText!, false);
    return;
  }
  if (item.responseMode === 'text') {
    const input = page.getByTestId('span-input');
    await expect(input).toBeEnabled({ timeout: 20_000 });
    await input.fill(item.answerText!);
    await page.getByTestId('submit-text').click();
    return;
  }
  await page.getByTestId(`option-${item.answerIndex}`).click();
}

/** Answers the current item with a deliberately wrong option. */
export async function answerIncorrectly(
  page: Page,
  type: ItemTypeId,
  opts: DrillOptions,
  index: number,
): Promise<void> {
  const item = expectedItem(type, opts.seed, index, opts.difficulty, localeOf(opts));
  await startSpanIfGated(page, item.presentation !== undefined);
  if (item.responseMode === 'trail') {
    if (item.stimulus.kind !== 'trail') throw new Error('expected a trail stimulus');
    // A trail always finishes; "wrong" means finishing with a click that went astray.
    await walkTrail(page, item.stimulus.nodes, true);
    return;
  }
  if (item.responseMode === 'tap') {
    await tapBoard(page, item, true);
    return;
  }
  if (item.responseMode === 'fill') {
    await fillPyramid(page, item.answerText!, true);
    return;
  }
  if (item.responseMode === 'text') {
    const input = page.getByTestId('span-input');
    await expect(input).toBeEnabled({ timeout: 20_000 });
    await input.fill('ZZZZZZ');
    await page.getByTestId('submit-text').click();
    return;
  }
  const wrong = item.answerIndex === 0 ? 1 : 0;
  await page.getByTestId(`option-${wrong}`).click();
}

/**
 * The sRGB triple a computed colour actually paints, whatever colour space it was written
 * in.
 *
 * Needed because the palette is authored in OKLCH and Chromium's `getComputedStyle`
 * faithfully returns `oklch(0.977 0.005 286)` rather than converting to `rgb()`. Scraping
 * numbers out of that string would read a *lightness* as a red channel. Painting one pixel
 * and reading it back asks the browser to do the conversion, so the assertion is about what
 * the user sees rather than about how the value was spelled.
 */
export async function paintedColour(
  page: Page,
  selector: string,
  property: 'backgroundColor' | 'color' = 'backgroundColor',
): Promise<{ r: number; g: number; b: number }> {
  return page.evaluate(
    ({ selector, property }) => {
      const element = document.querySelector(selector);
      if (!element) throw new Error(`no element matches ${selector}`);
      const value = getComputedStyle(element)[property as 'backgroundColor'];

      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d')!;
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
      return { r: r!, g: g!, b: b! };
    },
    { selector, property },
  );
}

export async function readLocalStorageSessions(page: Page): Promise<unknown[]> {
  return page.evaluate(() => {
    const raw = localStorage.getItem('iq:v1:sessions');
    return raw ? JSON.parse(raw) : [];
  });
}

export async function clearAppStorage(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
}
