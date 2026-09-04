import { describe, expect, it } from 'vitest';
import { ALL_META } from '@/lib/generators';
import { SPAN_FORMATS, spanAt, spanProfile } from '@/lib/spans';
import type { TypeStats } from '@/lib/scoring';
import type { Difficulty, ItemTypeId } from '@/lib/types';

const LEVELS: Difficulty[] = [1, 2, 3, 4, 5];

function stats(type: ItemTypeId, peakDifficulty: Difficulty | null): TypeStats {
  return {
    type,
    attempts: 1,
    correct: peakDifficulty === null ? 0 : 1,
    accuracy: peakDifficulty === null ? 0 : 1,
    chanceLevel: null,
    medianLatencyMs: null,
    bestStreak: 0,
    lastPlayedAt: null,
    peakDifficulty,
  };
}

describe('the span profile', () => {
  it('covers every Gwm format in the registry, and nothing else', () => {
    const gwm = ALL_META.filter((m) => m.domain === 'Gwm').map((m) => m.id);
    expect([...SPAN_FORMATS].sort()).toEqual([...gwm].sort());
  });

  it('reads each level as a span that never falls as the level rises', () => {
    for (const type of SPAN_FORMATS) {
      const spans = LEVELS.map((d) => spanAt(type, d).span);
      for (let i = 1; i < spans.length; i++) expect(spans[i]).toBeGreaterThanOrEqual(spans[i - 1]!);
      expect(spans[4]).toBeGreaterThan(spans[0]!);
    }
  });

  it('names digit span by direction', () => {
    expect(spanAt('span', 2)).toEqual({ span: 5, unit: 'digits-forward' });
    expect(spanAt('span', 3)).toEqual({ span: 5, unit: 'digits-backward' });
    expect(spanAt('n-back', 5)).toEqual({ span: 3, unit: 'back' });
  });

  it('lists only the formats with a level held, in profile order', () => {
    const rows = spanProfile([stats('n-back', 3), stats('span', 4), stats('block-span', null), stats('matrix', 5)]);
    expect(rows.map((r) => r.type)).toEqual(['span', 'n-back']);
    expect(rows[0]).toEqual({ type: 'span', level: 4, span: 6, unit: 'digits-backward' });
  });
});
