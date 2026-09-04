/**
 * The generator registry. Items are never stored — a `(type, seed, difficulty, locale)`
 * tuple reproduces one exactly, which is what lets a whole session be persisted in a few
 * bytes and replayed later for review, in whichever language the reader prefers.
 */
import { createRng } from '../rng';
import type { ChcDomain, Difficulty, Generator, Item, ItemTypeId, ItemTypeMeta } from '../types';
import { DEFAULT_LOCALE, dict, type Locale } from '../i18n';
import { matrixGenerator } from './matrix';
import { numberSeriesGenerator } from './series-number';
import { letterSeriesGenerator } from './series-letter';
import { oddOneOutGenerator } from './odd-one-out';
import { figuralAnalogyGenerator } from './analogy-figural';
import { syllogismGenerator } from './syllogism';
import { rotationGenerator } from './rotation';
import { blockRotationGenerator } from './block-rotation';
import { paperFoldingGenerator } from './paper-folding';
import { cubeNetGenerator } from './cube-net';
import { cubeNetOrientedGenerator } from './cube-net-oriented';
import { spanGenerator } from './span';
import { symbolSearchGenerator } from './symbol-search';
import { codingGenerator } from './coding';
import { nBackGenerator } from './n-back';
import { headCountGenerator } from './head-count';
import { figureWeightsGenerator } from './figure-weights';
import { arithmeticGenerator } from './arithmetic';
import { interferenceGenerator } from './interference';
import { trailMakingGenerator } from './trail-making';
import { blockSpanGenerator } from './block-span';
import { highNumberGenerator } from './high-number';
import { serialSubtractionGenerator } from './serial-subtraction';
import { mathRecallGenerator } from './math-recall';
import { timeLapseGenerator } from './time-lapse';
import { clockSpinGenerator } from './clock-spin';
import { gearTrainGenerator } from './gear-train';
import { handGameGenerator } from './hand-game';
import { calendarCountGenerator } from './calendar-count';
import { changeMakerGenerator } from './change-maker';
import { triangleMathGenerator } from './triangle-math';
import { towerGenerator } from './tower';
import { tableReasoningGenerator } from './table-reasoning';
import { numberLineGenerator } from './number-line';
import { reactionTimeGenerator } from './reaction-time';
import { goNoGoGenerator } from './go-no-go';
import { chimpTestGenerator } from './chimp-test';
import { logicGridGenerator } from './logic-grid';
import { featureMatchGenerator } from './feature-match';
import { patternRecallGenerator } from './pattern-recall';
import { pairedAssociatesGenerator } from './paired-associates';
import { pairsDelayedGenerator } from './pairs-delayed';

/**
 * Presentation order: reasoning first, then spatial, then memory (working, then long-term), then
 * speed and reaction, with the quantitative formats last. The order is cosmetic but not arbitrary — `typeHue` derives a
 * format's colour from its index here, so reordering re-spaces the whole wheel.
 */
export const GENERATORS: Generator[] = [
  matrixGenerator,
  numberSeriesGenerator,
  letterSeriesGenerator,
  oddOneOutGenerator,
  figuralAnalogyGenerator,
  syllogismGenerator,
  logicGridGenerator,
  towerGenerator,
  rotationGenerator,
  blockRotationGenerator,
  paperFoldingGenerator,
  cubeNetGenerator,
  cubeNetOrientedGenerator,
  clockSpinGenerator,
  gearTrainGenerator,
  patternRecallGenerator,
  spanGenerator,
  blockSpanGenerator,
  chimpTestGenerator,
  mathRecallGenerator,
  pairedAssociatesGenerator,
  symbolSearchGenerator,
  featureMatchGenerator,
  figureWeightsGenerator,
  nBackGenerator,
  headCountGenerator,
  codingGenerator,
  interferenceGenerator,
  highNumberGenerator,
  handGameGenerator,
  reactionTimeGenerator,
  goNoGoGenerator,
  trailMakingGenerator,
  arithmeticGenerator,
  serialSubtractionGenerator,
  timeLapseGenerator,
  calendarCountGenerator,
  changeMakerGenerator,
  triangleMathGenerator,
  tableReasoningGenerator,
  numberLineGenerator,
];

/**
 * Which generation of the generators produced an item. Bump on any change that alters what
 * `(type, seed, difficulty)` yields.
 *
 * Items are not stored, only their seeds — which is what keeps history small, and also what makes
 * history only as stable as the generators. A response records the tuple, so anything derived from
 * the item *afterwards* is derived from whatever the generators produce today. Two read-outs do
 * exactly that: `interferenceScore` recovers each Stroop trial's congruency by regenerating it, and
 * `switchCostScore` recovers each trail's form the same way. Change a plan and those old responses
 * are silently sorted into the wrong condition — a Stroop effect computed from a coin flip, with no
 * outward sign that anything is wrong.
 *
 * This is the outward sign. Sessions carry the version they were played at, and the two re-derived
 * contrasts read only sessions matching the current one. Everything a response records directly —
 * accuracy, latency, the chosen error type — stays valid across a bump and keeps being counted.
 *
 * Not the same thing as `SCHEMA_VERSION` in `store.ts`, which is about the persisted *shape*: a
 * schema bump discards the old key entirely, whereas an item bump keeps every session and narrows
 * what may be inferred from it.
 *
 * History:
 *  1 — original.
 *  2 — 2026-08: the distractor-leakage pass reworked twelve formats' option sets. Neither
 *      `interference` nor `trail-making` was among them, so no contrast actually lost data at
 *      this bump — the stamp exists so that the next one is not silent.
 *  3 — 2026-09: `reaction-time` became a block of five trials per item, with the median of the
 *      block recorded as the item's latency. A version-2 reaction item was one trial, so its
 *      latency and answer string are not comparable with a version-3 one. `paired-associates`
 *      gained a filled retention interval before its probe in the same bump, for the same reason:
 *      an immediate probe and a probe after seven seconds of distraction are different measurements.
 */
export const ITEM_VERSION = 3;

/**
 * Formats produced only inside another format's drill — see `ItemTypeMeta.scheduledBy`. Resolvable
 * by id like any other, so their responses replay from history, but absent from `ITEM_TYPE_IDS`
 * and `ALL_META`, which list what a reader can choose.
 */
export const SCHEDULED_GENERATORS: Generator[] = [pairsDelayedGenerator];

const BY_ID = new Map<ItemTypeId, Generator>([...GENERATORS, ...SCHEDULED_GENERATORS].map((g) => [g.meta.id, g]));

export const ITEM_TYPE_IDS: ItemTypeId[] = GENERATORS.map((g) => g.meta.id);

export function getGenerator(id: ItemTypeId): Generator {
  const g = BY_ID.get(id);
  if (!g) throw new Error(`unknown item type: ${id}`);
  return g;
}

/** Language-neutral facts: id, CHC domain, icon. */
export function getMeta(id: ItemTypeId): ItemTypeMeta {
  return getGenerator(id).meta;
}

export interface ItemTypeText {
  name: string;
  blurb: string;
  description: string;
  seenIn: string;
}

/** The translated name, blurb, description and "seen in" list for an item type. */
export function getItemText(id: ItemTypeId, locale: Locale): ItemTypeText {
  return dict(locale).items[id];
}

export function isItemTypeId(value: string): value is ItemTypeId {
  return BY_ID.has(value as ItemTypeId);
}

export function generateItem(
  id: ItemTypeId,
  seed: string,
  difficulty: Difficulty,
  locale: Locale = DEFAULT_LOCALE,
): Item {
  return getGenerator(id).generate(seed, difficulty, locale);
}

export const ALL_META: ItemTypeMeta[] = GENERATORS.map((g) => g.meta);

/** The scheduled formats' metadata, for the progress page's per-type rows. */
export const SCHEDULED_META: ItemTypeMeta[] = SCHEDULED_GENERATORS.map((g) => g.meta);

/** Every item type paired with its translated text, in presentation order. */
export function allItemTypes(locale: Locale): (ItemTypeMeta & ItemTypeText)[] {
  return ALL_META.map((meta) => ({ ...meta, ...getItemText(meta.id, locale) }));
}

/** The seven CHC broad abilities, in the order the site lists them. */
export const DOMAIN_ORDER: ChcDomain[] = ['Gf', 'Gv', 'Gwm', 'Glr', 'Gs', 'Gt', 'Gq'];

/**
 * The short test's draw: one offered format per domain, chosen from the session seed.
 *
 * The full test is one item per format, and at forty formats that is a long sitting. The short test
 * keeps the one property that made the full test worth having — every domain is reached — and gives
 * up the other: which format stands for a domain is drawn, not fixed, so two short tests on different
 * seeds sample the domains differently and a reader who repeats it is not repeating the same seven
 * formats. The draw is from the seed, so a shared link is the same seven items in either language.
 */
export function onePerDomain(seed: string): ItemTypeId[] {
  const rng = createRng(`short-test:${seed}`);
  return DOMAIN_ORDER.map((domain) => rng.pick(ALL_META.filter((m) => m.domain === domain)).id);
}
