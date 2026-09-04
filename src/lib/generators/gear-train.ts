/**
 * Gear train — wheels joined by teeth and belts; the first turns as shown. How does the last turn?
 *
 * The mechanical-comprehension item. The Bennett test and the DAT Mechanical Reasoning subtest are
 * mostly pictures of everyday physics with a question in words, which is why the family never had a
 * row in GENERATABILITY.md §2: the physics is fine, the words and the drawings are not generatable.
 * Gear trains are the exception. A train is a chain of wheels, each joined to the next by meshing
 * teeth or by a belt, and two things about the last wheel follow from the chain by rules a child can
 * be taught in a minute and an adult gets wrong under time: which way it turns, and how fast.
 *
 * ## The two rules
 *
 * Direction reverses at every mesh and at every crossed belt, and is kept by an open belt. Speed is
 * multiplied at every link by the ratio of the driving wheel's size to the driven wheel's — the
 * number on each wheel serves as its tooth count for a mesh and its diameter for a belt, which is
 * physically the same thing, since a gear's pitch diameter is proportional to its teeth. Over a chain
 * of plain meshes the ratio telescopes to first over last, and the wheels between drop out; that is
 * the insight the plain levels reward, and the belts at the higher levels are what stop it being
 * the only thing to know.
 *
 * ## Options and diagnoses
 *
 * Four: the answer's direction and speed, the same speed the other way (`wrong-direction` — a
 * reversal miscounted), the same direction with the speed inverted (`wrong-rule` — multiplied where
 * it should have divided), and both wrong (`plausible`). The speed ratio is never 1, so the inverted
 * speed is always a different option. Direction is written as a turning arrow and speed as a
 * multiplier, so nothing on the item is a word.
 *
 * ## What the level changes
 *
 * The length of the chain and what joins it. Two meshed wheels at level 1; three at level 2; a belt
 * enters at level 3, a crossed belt at level 4, and level 5 has five wheels with both kinds of belt
 * among the meshes. The size numbers are chosen so that the final ratio stays a small fraction.
 */
import { createRng, type Rng } from '../rng';
import { dict, type Locale } from '../i18n';
import type { Difficulty, ErrorType, Generator, Item, ItemTypeMeta, Option } from '../types';

const meta: ItemTypeMeta = {
  id: 'gear-train',
  domain: 'Gv',
  icon: '⚙',
  sprintable: false,
};

/** How two consecutive wheels are joined. */
export type GearLink = 'mesh' | 'open' | 'crossed';

export interface GearTrain {
  /** Wheel sizes: teeth for a mesh, diameter for a belt. */
  sizes: number[];
  /** `links[i]` joins wheel i to wheel i + 1. */
  links: GearLink[];
}

/**
 * The first wheel's direction is drawn from the seed and shown by its arrow, rather than fixed
 * clockwise. Fixed, it leaked: two meshed wheels always reverse, so every level-1 answer turned the
 * same way and a reader who never looked at the drawing could pick the arrow.
 */
export function driverClockwiseFor(seed: string, difficulty: Difficulty): boolean {
  return createRng(`gear-train-driver:${seed}:${difficulty}`).bool();
}

interface Plan {
  wheels: number;
  /** Which kinds of link may appear, beyond a mesh. */
  belts: GearLink[];
}

export function planFor(difficulty: Difficulty): Plan {
  switch (difficulty) {
    case 1:
      return { wheels: 2, belts: [] };
    case 2:
      return { wheels: 3, belts: [] };
    case 3:
      return { wheels: 3, belts: ['open'] };
    case 4:
      return { wheels: 4, belts: ['open', 'crossed'] };
    case 5:
      return { wheels: 5, belts: ['open', 'crossed'] };
  }
}

const SIZES = [12, 16, 18, 24, 32, 36];
/** Numerator and denominator of the final ratio, in lowest terms, may not exceed this. */
const MAX_RATIO_TERM = 9;
const MAX_ATTEMPTS = 200;

export const CLOCKWISE = '↻';
export const ANTICLOCKWISE = '↺';

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Whether the last wheel turns the same way as the first, and how fast relative to it. */
export function solveTrain(train: GearTrain): { sameDirection: boolean; ratio: [number, number] } {
  let reversals = 0;
  let num = 1;
  let den = 1;
  for (let i = 0; i < train.links.length; i++) {
    if (train.links[i] !== 'open') reversals++;
    num *= train.sizes[i]!;
    den *= train.sizes[i + 1]!;
    const g = gcd(num, den);
    num /= g;
    den /= g;
  }
  return { sameDirection: reversals % 2 === 0, ratio: [num, den] };
}

/** `×2`, `×1/2`, `×3/2` — the speed of the last wheel for every turn of the first. */
export function speedLabel([num, den]: [number, number]): string {
  return den === 1 ? `×${num}` : `×${num}/${den}`;
}

function optionText(clockwise: boolean, ratio: [number, number]): string {
  return `${clockwise ? CLOCKWISE : ANTICLOCKWISE} ${speedLabel(ratio)}`;
}

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.gearTrain;
  const rng = createRng(`gear-train:${seed}:${difficulty}`);
  const plan = planFor(difficulty);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const train = drawTrain(plan, rng);
    const { sameDirection, ratio } = solveTrain(train);
    const [num, den] = ratio;
    if (num === den) continue;
    if (num > MAX_RATIO_TERM || den > MAX_RATIO_TERM) continue;
    // Every belt kind the level allows should be on show at least once.
    if (!plan.belts.every((b) => train.links.includes(b))) continue;

    const driverClockwise = driverClockwiseFor(seed, difficulty);
    const clockwise = sameDirection ? driverClockwise : !driverClockwise;
    const inverted: [number, number] = [den, num];
    const wrong: { text: string; errorType: ErrorType }[] = [
      { text: optionText(!clockwise, ratio), errorType: 'wrong-direction' },
      { text: optionText(clockwise, inverted), errorType: 'wrong-rule' },
      { text: optionText(!clockwise, inverted), errorType: 'plausible' },
    ];
    const order = rng.shuffle([-1, 0, 1, 2]);
    const options: Option[] = order.map((i) => ({ kind: 'text', text: i < 0 ? optionText(clockwise, ratio) : wrong[i]!.text }));
    const errorTypes: ErrorType[] = order.map((i) => (i < 0 ? 'correct' : wrong[i]!.errorType));
    const answerIndex = order.indexOf(-1);

    const reversals = train.links.filter((l) => l !== 'open').length;
    return {
      type: 'gear-train',
      seed,
      difficulty,
      prompt: t.prompt,
      stimulus: { kind: 'gears', sizes: train.sizes, links: train.links, driverClockwise },
      responseMode: 'choice',
      options,
      answerIndex,
      errorTypes,
      explanation: {
        summary: t.summary(answerIndex + 1, clockwise, speedLabel(ratio)),
        rules: [
          t.ruleDirection(reversals),
          t.ruleSpeed(train.sizes[0]!, train.sizes[train.sizes.length - 1]!, speedLabel(ratio)),
          ...(plan.belts.length > 0 ? [t.ruleBelts] : [t.ruleIdlers]),
        ],
      },
      suggestedSeconds: 12 + difficulty * 6,
    };
  }

  throw new Error(`gear-train generator exhausted ${MAX_ATTEMPTS} attempts for seed "${seed}" d${difficulty}`);
}

function drawTrain(plan: Plan, rng: Rng): GearTrain {
  const sizes: number[] = [];
  for (let i = 0; i < plan.wheels; i++) {
    let size = SIZES[rng.int(0, SIZES.length - 1)]!;
    // Consecutive wheels differ in size, so every link changes the speed and the drawing reads.
    while (i > 0 && size === sizes[i - 1]) size = SIZES[rng.int(0, SIZES.length - 1)]!;
    sizes.push(size);
  }
  const kinds: GearLink[] = ['mesh', ...plan.belts];
  const links: GearLink[] = [];
  for (let i = 0; i < plan.wheels - 1; i++) links.push(kinds[rng.int(0, kinds.length - 1)]!);
  return { sizes, links };
}

export const gearTrainGenerator: Generator = { meta, generate };
