/**
 * Tower — three beads on three pegs; how few moves turn this arrangement into that one?
 *
 * Shallice's Tower of London (1982), in the form the imaging literature settled on: the reader is
 * shown a start and a goal and asked for the *minimum number of moves*, without touching anything
 * (van den Heuvel et al., 2003; Schall et al., 2003). The executive demand is the planning — a move
 * has to be simulated and its consequences held before the next can be considered — and asking for
 * the count rather than the moves keeps the whole of that in the head, which is where the task puts
 * it. A board the reader could manipulate would let them solve by trial and error, and trial and
 * error is what the task exists to rule out.
 *
 * It is the first format on the site that measures *lookahead*. Matrix reasoning induces a rule
 * from what is shown; syllogisms check a conclusion against premises; nothing else asks for a
 * sequence of actions to be found and its length known before any of it happens.
 *
 * ## Why three beads and pegs of three, two and one
 *
 * The classic apparatus, and not only for provenance. The unequal peg heights are what make the
 * puzzle a puzzle: with three pegs of height three every bead can go anywhere and the shortest route
 * is nearly always obvious. With heights 3-2-1 there are thirty-six arrangements and a shortest
 * path of up to eight moves, and the interesting cases are the ones where a bead has to be moved
 * *away* from where it is wanted to make room — the counter-intuitive move that a plan has to
 * contain and a greedy reader will not make.
 *
 * ## Why difficulty is the length of the shortest solution
 *
 * Because that is the standard difficulty index for this task, and because it is the one thing
 * that measures planning depth directly. The answer is computed by breadth-first search over the
 * whole state space — thirty-six states, so exhaustively — and is therefore *proved* minimal rather
 * than asserted. Each level admits two adjacent lengths, so the level does not name the answer.
 */
import { createRng } from '../rng';
import { dict, type Locale } from '../i18n';
import { windowOptions } from './distractors';
import type {
  Difficulty,
  ErrorType,
  Figure,
  Generator,
  Item,
  ItemTypeMeta,
  Option,
  ShapeType,
} from '../types';

/** Peg heights, left to right. The classic apparatus. */
export const CAPACITIES: readonly number[] = [3, 2, 1];

/**
 * A board: one array per peg, each listing bead ids from the bottom up. Beads are 0, 1 and 2 and
 * are told apart by shape, never by hue.
 */
export type TowerState = number[][];

export const BEAD_SHAPES: readonly ShapeType[] = ['circle', 'square', 'triangle'];

/** How a bead is drawn: the shape is its identity, at one size and one solid fill. */
export function beadFigure(bead: number): Figure {
  return {
    layout: 'center',
    shapes: [{ type: BEAD_SHAPES[bead]!, size: 4, color: 5, rotation: 0, x: 0.5, y: 0.5 }],
  };
}

export function stateKey(state: TowerState): string {
  return state.map((peg) => peg.join('')).join('|');
}

/** Every legal single move from a state: the top bead of one peg onto another that has room. */
export function legalMoves(state: TowerState): TowerState[] {
  const out: TowerState[] = [];
  for (let from = 0; from < state.length; from++) {
    if (state[from]!.length === 0) continue;
    for (let to = 0; to < state.length; to++) {
      if (to === from || state[to]!.length >= CAPACITIES[to]!) continue;
      const next = state.map((peg) => [...peg]);
      next[to]!.push(next[from]!.pop()!);
      out.push(next);
    }
  }
  return out;
}

/**
 * The shortest distance from `start` to every reachable state. Breadth-first over thirty-six
 * states — exhaustive, so the minimum is a fact and not an estimate.
 */
export function distancesFrom(start: TowerState): Map<string, { state: TowerState; moves: number }> {
  const seen = new Map<string, { state: TowerState; moves: number }>();
  seen.set(stateKey(start), { state: start, moves: 0 });
  const queue: TowerState[] = [start];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const here = seen.get(stateKey(current))!.moves;
    for (const next of legalMoves(current)) {
      const key = stateKey(next);
      if (seen.has(key)) continue;
      seen.set(key, { state: next, moves: here + 1 });
      queue.push(next);
    }
  }
  return seen;
}

/** The fewest moves from one arrangement to another — the independent check the tests use. */
export function minimumMoves(start: TowerState, goal: TowerState): number {
  const found = distancesFrom(start).get(stateKey(goal));
  if (!found) throw new Error('tower: goal unreachable, which cannot happen on a connected board');
  return found.moves;
}

/** Every legal arrangement of the three beads. */
export function allStates(): TowerState[] {
  const out: TowerState[] = [];
  const place = (state: TowerState, beads: number[]) => {
    if (beads.length === 0) {
      out.push(state.map((peg) => [...peg]));
      return;
    }
    for (const bead of beads) {
      for (let peg = 0; peg < CAPACITIES.length; peg++) {
        if (state[peg]!.length >= CAPACITIES[peg]!) continue;
        state[peg]!.push(bead);
        place(state, beads.filter((b) => b !== bead));
        state[peg]!.pop();
      }
    }
  };
  place(CAPACITIES.map(() => []), [0, 1, 2]);
  // The recursion places beads in every order, so each arrangement is reached more than once.
  const unique = new Map(out.map((s) => [stateKey(s), s]));
  return [...unique.values()];
}

interface Plan {
  /** The shortest solutions a level may ask for. Two lengths, so the level does not name the answer. */
  moves: [number, number];
}

/**
 * Three to eight moves — the whole range the board offers above the trivial.
 *
 * Not two. A two-move item is answerable at a glance, and it also leaks: the option set is a run of
 * four counts with a floor of one, so an answer of two can only ever be the smallest or second
 * smallest option, and the blind solver in `tests/leakage.test.ts` scored 42% on "pick the
 * smallest" at that level. Starting at three gives the answer three ranks to land on, and the
 * calibrated margin absorbs the rest.
 */
function planFor(difficulty: Difficulty): Plan {
  switch (difficulty) {
    case 1:
      return { moves: [3, 4] };
    case 2:
      return { moves: [4, 5] };
    case 3:
      return { moves: [5, 6] };
    case 4:
      return { moves: [6, 7] };
    case 5:
      return { moves: [7, 8] };
  }
}

const STATES = allStates();

const meta: ItemTypeMeta = {
  id: 'tower',
  /*
   * Gf. Planning is filed under fluid reasoning in CHC — the narrow ability is sequential reasoning
   * — and what the item asks is a chain of inferences about consequences, held in order. It is not Gv:
   * the board is trivially perceived, and nothing about it needs to be rotated or transformed.
   */
  domain: 'Gf',
  icon: '⏢',
  // A plan of six moves takes longer than a couple of seconds to find.
  sprintable: false,
};

const MAX_ATTEMPTS = 60;

function generate(seed: string, difficulty: Difficulty, locale: Locale): Item {
  const t = dict(locale).gen.tower;
  const rng = createRng(`tower:${seed}:${difficulty}`);
  const plan = planFor(difficulty);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const start = rng.pick(STATES);
    const wanted = rng.pick(plan.moves);
    const goals = [...distancesFrom(start).values()].filter((entry) => entry.moves === wanted);
    if (goals.length === 0) continue;
    const goal = rng.pick(goals).state;
    const answer = wanted;

    /*
     * A run of four consecutive counts, the answer at a uniformly drawn rank. One move fewer is the
     * plan that does not exist — the route a reader believes in because they skipped the move that
     * clears a peg; one more is a detour, the plan that moved something twice.
     */
    const diagnose = (value: number): ErrorType =>
      Math.abs(value - answer) === 1 ? 'off-by-one' : 'plausible';
    const set = windowOptions(rng, answer, 4, diagnose, 1);
    if (!set) continue;

    const shuffled = rng.shuffle(set.values);
    const options: Option[] = shuffled.map((v) => ({ kind: 'text', text: String(v) }));

    return {
      type: 'tower',
      seed,
      difficulty,
      prompt: t.prompt,
      stimulus: { kind: 'tower', capacities: [...CAPACITIES], start, goal },
      responseMode: 'choice',
      options,
      answerIndex: shuffled.indexOf(answer),
      errorTypes: shuffled.map((v) => set.errors.get(v) ?? 'plausible'),
      explanation: {
        summary: t.summary(answer),
        rules: [t.ruleOneAtATime, t.ruleCapacity, t.ruleMinimum(answer), t.ruleAway],
      },
      suggestedSeconds: 15 + answer * 5,
    };
  }

  throw new Error(`tower generator exhausted ${MAX_ATTEMPTS} attempts for seed "${seed}" d${difficulty}`);
}

export const towerGenerator: Generator = { meta, generate };
