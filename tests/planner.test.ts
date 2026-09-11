import { describe, expect, it } from 'vitest';
import { ALL_META, DOMAIN_ORDER, getMeta, ITEM_TYPE_IDS } from '@/lib/generators';
import {
  adviseToday,
  BUDGET_MINUTES,
  estimateSeconds,
  OWN_MEDIAN_FROM,
  planTest,
  THIN_BELOW,
  TYPICAL_SECONDS,
} from '@/lib/planner';
import type { Summary, TypeStats } from '@/lib/scoring';
import type { ChcDomain, ItemTypeId } from '@/lib/types';

function typeStats(type: ItemTypeId, attempts: number, extra: Partial<TypeStats> = {}): TypeStats {
  return {
    type,
    attempts,
    correct: attempts,
    accuracy: attempts ? 1 : null,
    chanceLevel: null,
    medianLatencyMs: null,
    bestStreak: 0,
    lastPlayedAt: attempts ? 1_000 : null,
    peakDifficulty: null,
    ...extra,
  };
}

/** A summary in which every format has `attempts` answers, with per-type and per-domain overrides. */
function summaryWith(
  attempts: number,
  perType: Partial<Record<ItemTypeId, Partial<TypeStats>>> = {},
  perDomain: Partial<Record<ChcDomain, { attempts?: number; accuracy?: number | null }>> = {},
): Summary {
  const byType = ALL_META.map((m) => typeStats(m.id, attempts, perType[m.id]));
  const byDomain = DOMAIN_ORDER.map((domain) => {
    const own = byType.filter((s) => getMeta(s.type).domain === domain);
    const a = perDomain[domain]?.attempts ?? own.reduce((s, x) => s + x.attempts, 0);
    const acc = perDomain[domain]?.accuracy ?? (a ? 1 : null);
    return { domain, attempts: a, correct: Math.round(a * (acc ?? 0)), accuracy: acc };
  });
  const total = byType.reduce((s, x) => s + x.attempts, 0);
  return {
    overall: { attempts: total, correct: total, accuracy: total ? 1 : null, medianLatencyMs: null, sessions: 1, dayStreak: 0 },
    byType,
    byDomain,
  };
}

describe('per-item estimates', () => {
  it('cover every format the registry knows', () => {
    for (const id of ITEM_TYPE_IDS) expect(TYPICAL_SECONDS[id], id).toBeGreaterThan(0);
  });

  it('use the table until the reader has enough of a history, then blend in their own median', () => {
    const fast = typeStats('matrix', OWN_MEDIAN_FROM, { medianLatencyMs: 6_000 });
    expect(estimateSeconds('matrix', undefined)).toBe(TYPICAL_SECONDS.matrix);
    expect(estimateSeconds('matrix', { ...fast, attempts: OWN_MEDIAN_FROM - 1 })).toBe(TYPICAL_SECONDS.matrix);
    const blended = estimateSeconds('matrix', fast);
    expect(blended).toBeLessThan(TYPICAL_SECONDS.matrix);
    expect(blended).toBeGreaterThan(6 + 4);
  });
});

describe('planning a sitting', () => {
  it('fits the budget and never comes back empty', () => {
    for (const minutes of BUDGET_MINUTES) {
      const plan = planTest(minutes, { kind: 'mixed' }, null, 'PLAN0001');
      expect(plan.types.length, `${minutes} min`).toBeGreaterThan(0);
      expect(plan.estimatedSeconds, `${minutes} min`).toBeLessThanOrEqual(minutes * 60);
    }
  });

  it('is the whole registry, in order, when asked for the full test', () => {
    const plan = planTest(null, { kind: 'mixed' }, null, 'PLAN0001');
    expect(plan.types).toEqual(ITEM_TYPE_IDS);
  });

  it('visits the domains in turn when mixed, so a short run still spans the profile', () => {
    const plan = planTest(10, { kind: 'mixed' }, null, 'PLAN0002');
    const domains = plan.types.map((t) => getMeta(t).domain);
    // The first seven items are one per domain, in the site's order.
    expect(domains.slice(0, DOMAIN_ORDER.length)).toEqual(DOMAIN_ORDER);
    // A longer budget extends the same draw rather than dealing a new one.
    const longer = planTest(20, { kind: 'mixed' }, null, 'PLAN0002');
    expect(longer.types.slice(0, plan.types.length)).toEqual(plan.types);
  });

  it('stays inside one domain when asked to', () => {
    for (const domain of DOMAIN_ORDER) {
      const plan = planTest(15, { kind: 'domain', domain }, null, 'PLAN0003');
      expect(plan.types.length, domain).toBeGreaterThan(0);
      for (const t of plan.types) expect(getMeta(t).domain, t).toBe(domain);
      expect(plan.perDomain.find((x) => x.domain === domain)?.count).toBe(plan.types.length);
    }
  });

  it('puts the least-answered formats first when filling gaps', () => {
    const never: ItemTypeId[] = ['tower', 'gear-train', 'chimp-test'];
    const summary = summaryWith(12, Object.fromEntries(never.map((id) => [id, { attempts: 0, lastPlayedAt: null }])));
    const plan = planTest(5, { kind: 'gaps' }, summary, 'PLAN0004');
    expect(plan.types.slice(0, never.length).sort()).toEqual([...never].sort());
  });

  it('draws differently on a different seed', () => {
    const a = planTest(10, { kind: 'mixed' }, null, 'SEEDAAAA').types;
    const b = planTest(10, { kind: 'mixed' }, null, 'SEEDBBBB').types;
    expect(a).not.toEqual(b);
  });
});

describe('the suggestion for today', () => {
  it('starts a newcomer on a mixed run', () => {
    expect(adviseToday(null).kind).toBe('first');
    expect(adviseToday(summaryWith(0))).toMatchObject({ kind: 'first', focus: { kind: 'mixed' } });
  });

  it('names the thin domains and points at the gaps while any are thin', () => {
    const summary = summaryWith(THIN_BELOW, {}, { Gq: { attempts: 2 }, Gt: { attempts: 0, accuracy: null } });
    const advice = adviseToday(summary);
    expect(advice).toMatchObject({ kind: 'fill', focus: { kind: 'gaps' } });
    if (advice.kind === 'fill') expect(advice.domains).toEqual(['Gt', 'Gq']);
  });

  it('points at a domain clearly below the rest once everything is measured', () => {
    const summary = summaryWith(THIN_BELOW, {}, { Gv: { accuracy: 0.4 } });
    expect(adviseToday(summary)).toMatchObject({ kind: 'weakest', domain: 'Gv', focus: { kind: 'domain', domain: 'Gv' } });
  });

  it('otherwise revisits the domain left longest', () => {
    const summary = summaryWith(THIN_BELOW, { matrix: { lastPlayedAt: 5_000 } });
    // Every format was last played at 1 000 except a Gf one, so Gf is freshest; the stalest is the first other domain.
    const advice = adviseToday(summary);
    expect(advice.kind).toBe('stale');
    if (advice.kind === 'stale') expect(advice.domain).not.toBe('Gf');
  });
});
