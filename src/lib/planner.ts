/**
 * The test planner: which items to sit today, given how long the reader has.
 *
 * The full test is one item per format, and at forty-odd formats that is a sitting most people do
 * not have. This module turns a *time budget* and a *focus* into an ordered list of formats that the
 * quiz deals exactly as given, and it offers one suggestion for today from the reader's own history —
 * the thinnest domains first, because a profile with holes in it is the one thing a short run can
 * actually repair.
 *
 * Nothing here is measured or scored. It chooses what to ask; `Quiz` asks it and `scoring` reads it.
 */
import { ALL_META, DOMAIN_ORDER } from './generators';
import { createRng } from './rng';
import type { Summary, TypeStats } from './scoring';
import type { ChcDomain, ItemTypeId, ItemTypeMeta } from './types';

/**
 * How long one item of each format typically takes, in seconds, from paint to answer — reading the
 * instruction, any playback the format has to do before it can be answered, and the answer itself.
 *
 * Rough by design, and rounded to the nearest five. A budget of ten minutes is a promise about the
 * order of magnitude, not a countdown; the reader's own medians replace these as soon as there are
 * enough of them (see `estimateSeconds`). A `Record` over the id union so that a new format cannot
 * ship without a figure here: the compiler, not a runtime default, is what keeps the map complete.
 */
export const TYPICAL_SECONDS: Record<ItemTypeId, number> = {
  matrix: 45,
  'series-number': 40,
  'series-letter': 35,
  'odd-one-out': 30,
  'analogy-figural': 40,
  syllogism: 40,
  rotation: 30,
  'paper-folding': 45,
  span: 25,
  'symbol-search': 15,
  'figure-weights': 45,
  'n-back': 40,
  'trail-making': 30,
  'block-span': 25,
  interference: 10,
  arithmetic: 15,
  'head-count': 30,
  coding: 15,
  'high-number': 10,
  'go-no-go': 40,
  'serial-subtraction': 30,
  'math-recall': 30,
  'time-lapse': 25,
  'clock-spin': 25,
  'change-maker': 25,
  'triangle-math': 25,
  tower: 50,
  'table-reasoning': 45,
  'reaction-time': 30,
  'feature-match': 15,
  'cube-net': 45,
  'cube-net-oriented': 50,
  'block-rotation': 40,
  'gear-train': 35,
  'logic-grid': 90,
  'chimp-test': 25,
  'number-line': 15,
  'pattern-recall': 20,
  'paired-associates': 45,
  'pairs-delayed': 15,
  'calendar-count': 30,
  'hand-game': 10,
};

/** Below this many attempts, a reader's own median is not yet better evidence than the table. */
export const OWN_MEDIAN_FROM = 3;

/**
 * Seconds a run should allow for one item of `type`, for this reader.
 *
 * The table figure, halved with the reader's own median once they have one: the median is the
 * answer alone, so a few seconds are added for reading the item, and the table half keeps a fast
 * reader's estimate from collapsing to nothing on a format that has to play itself first.
 */
export function estimateSeconds(type: ItemTypeId, stats: TypeStats | undefined): number {
  const typical = TYPICAL_SECONDS[type];
  if (!stats || stats.attempts < OWN_MEDIAN_FROM || stats.medianLatencyMs === null) return typical;
  const own = stats.medianLatencyMs / 1000 + 4;
  return Math.round((own + typical) / 2);
}

/** The time budgets on offer, in minutes. `null` is the full test: one item per format. */
export const BUDGET_MINUTES: readonly number[] = [5, 10, 15, 20];

export type Focus =
  /** Every domain in turn, the format for each drawn afresh every round. */
  | { kind: 'mixed' }
  /** One domain only, its formats in a drawn order. */
  | { kind: 'domain'; domain: ChcDomain }
  /** The formats with the fewest answers behind them, so the profile fills in where it is thin. */
  | { kind: 'gaps' };

export interface Plan {
  /** Formats in order of presentation; the quiz deals exactly this list. */
  types: ItemTypeId[];
  /** The sum of the per-item estimates, in seconds. */
  estimatedSeconds: number;
  /** How many items each domain contributes, in `DOMAIN_ORDER`, zeros included. */
  perDomain: { domain: ChcDomain; count: number }[];
}

function statsFor(summary: Summary | null | undefined, type: ItemTypeId): TypeStats | undefined {
  return summary?.byType.find((s) => s.type === type);
}

function tally(types: ItemTypeId[]): Plan['perDomain'] {
  const domainOf = new Map(ALL_META.map((m) => [m.id, m.domain]));
  return DOMAIN_ORDER.map((domain) => ({
    domain,
    count: types.filter((t) => domainOf.get(t) === domain).length,
  }));
}

function finish(types: ItemTypeId[], cost: (t: ItemTypeId) => number): Plan {
  return {
    types,
    estimatedSeconds: types.reduce((sum, t) => sum + cost(t), 0),
    perDomain: tally(types),
  };
}

/**
 * The order candidates are consumed in for a focus, as an endless cycle. The plan takes from the
 * front until the budget is spent, so the cycle's early part is what a short run gets and the order
 * therefore carries the focus's whole meaning:
 *
 * - `mixed` visits the domains in turn, round after round, so any prefix is as balanced as its
 *   length allows and a five-minute run still touches most of the profile. Which format stands for a
 *   domain in a round is drawn from the seed, so two runs on different seeds ask different things.
 * - `domain` is that domain's formats in a drawn order, then again.
 * - `gaps` is every format sorted by how few answers it has, oldest-played first among ties, so the
 *   items that would most change the progress page come first. Ties beyond that are drawn.
 */
function* cycle(focus: Focus, summary: Summary | null | undefined, seed: string): Generator<ItemTypeId> {
  const rng = createRng(`plan:${seed}`);
  if (focus.kind === 'mixed') {
    const byDomain = DOMAIN_ORDER.map((d) => rng.shuffle(ALL_META.filter((m) => m.domain === d)));
    for (let round = 0; ; round++) {
      for (const formats of byDomain) {
        if (formats.length > 0) yield formats[round % formats.length]!.id;
      }
    }
  }
  if (focus.kind === 'domain') {
    const formats = rng.shuffle(ALL_META.filter((m) => m.domain === focus.domain));
    if (formats.length === 0) return;
    for (let i = 0; ; i++) yield formats[i % formats.length]!.id;
  }
  const order = rng
    .shuffle(ALL_META)
    .map((m, tie) => ({ m, tie, stats: statsFor(summary, m.id) }))
    .sort(
      (a, b) =>
        (a.stats?.attempts ?? 0) - (b.stats?.attempts ?? 0) ||
        (a.stats?.lastPlayedAt ?? 0) - (b.stats?.lastPlayedAt ?? 0) ||
        a.tie - b.tie,
    )
    .map((x) => x.m);
  for (let i = 0; ; i++) yield order[i % order.length]!.id;
}

/**
 * The items for a sitting of `minutes`, in order.
 *
 * Greedy against the budget: items are taken from the focus's cycle while they fit, and a format
 * that does not fit is skipped rather than ending the run, so the tail of a budget goes to a quick
 * format rather than to nothing. Never empty — a budget too small for any item still gets its first
 * one, because a plan with nothing in it is not a plan. `null` minutes is the full test, which is
 * not a budget at all but the registry in its own order, one item each.
 */
export function planTest(
  minutes: number | null,
  focus: Focus,
  summary: Summary | null | undefined,
  seed: string,
): Plan {
  const cost = (t: ItemTypeId) => estimateSeconds(t, statsFor(summary, t));
  if (minutes === null) return finish(ALL_META.map((m) => m.id), cost);

  const budget = minutes * 60;
  const chosen: ItemTypeId[] = [];
  let spent = 0;
  let skippedInARow = 0;
  const source = cycle(focus, summary, seed);
  // A full cycle of skips means nothing left fits; the registry bounds the cycle's period.
  const giveUpAfter = ALL_META.length;
  while (skippedInARow < giveUpAfter) {
    const next = source.next();
    if (next.done) break;
    const c = cost(next.value);
    if (chosen.length > 0 && spent + c > budget) {
      skippedInARow++;
      continue;
    }
    chosen.push(next.value);
    spent += c;
    skippedInARow = 0;
  }
  return finish(chosen, cost);
}

/** The seconds a full test would take this reader — the number the "full" option shows. */
export function fullTestSeconds(summary: Summary | null | undefined): number {
  return ALL_META.reduce((sum, m) => sum + estimateSeconds(m.id, statsFor(summary, m.id)), 0);
}

/** A domain with fewer answers than this behind it is one the progress page still shows as faded. */
export const THIN_BELOW = 10;

export type Advice =
  /** No history at all: a balanced first sitting. */
  | { kind: 'first'; focus: Focus; minutes: number }
  /** Some domains are still thin; name them and fill them. */
  | { kind: 'fill'; focus: Focus; minutes: number; domains: ChcDomain[] }
  /** Everything is measured; work the weakest domain. */
  | { kind: 'weakest'; focus: Focus; minutes: number; domain: ChcDomain; accuracy: number }
  /** Everything is measured and none stands out; revisit the one left longest. */
  | { kind: 'stale'; focus: Focus; minutes: number; domain: ChcDomain; lastPlayedAt: number };

/** Ten minutes: long enough to touch every domain once at most formats' pace, short enough to keep. */
const ADVISED_MINUTES = 10;

/**
 * One suggestion for today, from the history alone.
 *
 * The order of the cases is the order of what a short run can do for the reader: give a profile to
 * someone with none, fill the holes in one that has them, and only then go looking for weaknesses —
 * a weakness read off fewer than ten items is noise, which is why the progress page fades those
 * bars, and why this does not point at one until they are solid. Below that, with nothing weak, the
 * domain not seen for longest is the one whose figure is most out of date.
 */
export function adviseToday(summary: Summary | null | undefined): Advice {
  if (!summary || summary.overall.attempts === 0) {
    return { kind: 'first', focus: { kind: 'mixed' }, minutes: ADVISED_MINUTES };
  }
  const thin = summary.byDomain
    .filter((d) => d.attempts < THIN_BELOW)
    .sort((a, b) => a.attempts - b.attempts)
    .map((d) => d.domain);
  // Domains the registry has but the summary has never seen are the thinnest of all.
  for (const d of DOMAIN_ORDER) {
    if (!summary.byDomain.some((x) => x.domain === d) && !thin.includes(d)) thin.unshift(d);
  }
  if (thin.length > 0) {
    return { kind: 'fill', focus: { kind: 'gaps' }, minutes: ADVISED_MINUTES, domains: thin };
  }

  const measured = summary.byDomain.filter((d) => d.accuracy !== null);
  const weakest = [...measured].sort((a, b) => a.accuracy! - b.accuracy!)[0];
  const mean = measured.reduce((s, d) => s + d.accuracy!, 0) / Math.max(1, measured.length);
  // A domain stands out only when it is clearly below the reader's own average.
  if (weakest && weakest.accuracy! < mean - 0.1) {
    return {
      kind: 'weakest',
      focus: { kind: 'domain', domain: weakest.domain },
      minutes: ADVISED_MINUTES,
      domain: weakest.domain,
      accuracy: weakest.accuracy!,
    };
  }

  const lastByDomain = DOMAIN_ORDER.map((domain) => ({
    domain,
    lastPlayedAt: Math.max(
      0,
      ...ALL_META.filter((m) => m.domain === domain).map((m) => statsFor(summary, m.id)?.lastPlayedAt ?? 0),
    ),
  })).sort((a, b) => a.lastPlayedAt - b.lastPlayedAt);
  const stale = lastByDomain[0]!;
  return {
    kind: 'stale',
    focus: { kind: 'domain', domain: stale.domain },
    minutes: ADVISED_MINUTES,
    domain: stale.domain,
    lastPlayedAt: stale.lastPlayedAt,
  };
}

/** The format ids of a plan as the runner's `?types=` query value. */
export function encodeTypes(types: ItemTypeId[]): string {
  return types.join(',');
}

/** The formats named on the registry, for grouping in the planner's preview. */
export function metaOf(id: ItemTypeId): ItemTypeMeta {
  return ALL_META.find((m) => m.id === id)!;
}
