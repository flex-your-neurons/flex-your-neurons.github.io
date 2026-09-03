/**
 * The pattern-recall board: a grid flashes a set of cells, goes dark, and the reader taps the set back.
 *
 * Same lifecycle as the block-span board — gate, show, recall, frozen — and the same three
 * refusals: no mark on a tapped cell beyond the selection itself (the reader needs to see what they
 * have chosen, since a set can be edited, but never whether it is right), no verdict during recall,
 * and no announcement of the pattern. A tap toggles, so a slip is undone by tapping again; the
 * trial submits itself the moment the right *number* of cells is selected, like a span.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { dict, type Locale } from '../lib/i18n';
import type { Presentation } from '../lib/types';
import { encodeCells } from '../lib/generators/pattern-recall';

interface Props {
  size: number;
  /** Row-major indices of the lit cells. */
  cells: number[];
  presentation?: Presentation;
  reducedMotion?: boolean;
  locale: Locale;
  frozen: boolean;
  onRecallStart: () => void;
  onComplete: (tapped: string) => void;
}

type Phase = 'gate' | 'show' | 'recall';

export default function PatternBoard({
  size,
  cells,
  presentation,
  reducedMotion,
  locale,
  frozen,
  onRecallStart,
  onComplete,
}: Props) {
  const t = dict(locale).gen.patternRecall;
  const [phase, setPhase] = useState<Phase>('gate');
  const [selected, setSelected] = useState<number[]>([]);
  const lit = new Set(cells);
  const chosen = new Set(selected);

  /*
   * Reduced motion lengthens nothing here: there is one change on and one change off, which is not
   * flicker. The exposure is the encoding time the format depends on and is held constant.
   */
  void reducedMotion;
  const exposureMs = presentation?.stepMs ?? 1500;

  const key = `${size}:${cells.join('|')}`;
  useEffect(() => {
    setPhase('gate');
    setSelected([]);
  }, [key]);

  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const recallRef = useRef(onRecallStart);
  recallRef.current = onRecallStart;

  useEffect(() => {
    if (phase !== 'gate' || frozen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat) return;
      e.preventDefault();
      setPhase('show');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, frozen, key]);

  useEffect(() => {
    if (phase !== 'show') return;
    const timer = setTimeout(() => {
      setPhase('recall');
      recallRef.current();
    }, 400 + exposureMs);
    return () => clearTimeout(timer);
  }, [phase, key, exposureMs]);

  function tap(index: number) {
    if (frozen || phase !== 'recall') return;
    const next = chosen.has(index) ? selected.filter((c) => c !== index) : [...selected, index];
    setSelected(next);
    if (next.length >= cells.length) completeRef.current(encodeCells(next, size));
  }

  const wasWrong = frozen && encodeCells(selected, size) !== encodeCells(cells, size);

  return (
    <div
      class="pattern"
      data-stimulus="pattern"
      data-testid="pattern-board"
      data-pattern-phase={frozen ? 'revealed' : phase}
      data-pattern-selected={String(selected.length)}
    >
      <div class="pattern-status" role="status" aria-live="polite">
        {frozen ? (
          <span class="pattern-headline">{wasWrong ? t.revealWrong : t.revealRight}</span>
        ) : phase === 'gate' ? (
          <span class="subtle">{t.ready(cells.length)}</span>
        ) : phase === 'show' ? (
          <span class="pattern-headline">{t.watching}</span>
        ) : (
          <>
            <span class="pattern-headline">{t.nowTapThemBack}</span>
            <span class="subtle pattern-count" data-testid="pattern-count">
              {t.progress(selected.length, cells.length)}
            </span>
          </>
        )}
      </div>

      <div class="pattern-grid" style={{ '--pattern-size': String(size) } as never}>
        {Array.from({ length: size * size }, (_, index) => {
          const wasLit = lit.has(index);
          const tapped = chosen.has(index);
          /* Once the answer is out, three marks and no hue: filled for a hit, a ring for a miss, a
             cross for a cell tapped that never lit. */
          const mark = frozen ? (wasLit && tapped ? 'hit' : wasLit ? 'missed' : tapped ? 'extra' : undefined) : undefined;
          return (
            <button
              key={index}
              type="button"
              class="pattern-cell"
              data-testid={`pattern-cell-${index}`}
              data-pattern-lit={phase === 'show' && wasLit ? 'true' : undefined}
              data-pattern-selected={!frozen && tapped ? 'true' : undefined}
              data-pattern-mark={mark}
              disabled={frozen || phase !== 'recall'}
              onClick={() => tap(index)}
              aria-label={t.cellLabel(Math.floor(index / size) + 1, (index % size) + 1)}
              aria-pressed={!frozen && phase === 'recall' ? tapped : undefined}
            />
          );
        })}
      </div>

      {phase === 'gate' && !frozen && (
        <div class="pattern-actions">
          <button type="button" class="btn btn-primary" data-testid="span-start" onClick={() => setPhase('show')}>
            {t.start} <span aria-hidden="true">↵</span>
          </button>
        </div>
      )}

      {frozen && (
        <p class="subtle pattern-legend">
          <span>{t.legendLit}</span>
          {wasWrong && <span>{t.legendMissed}</span>}
          {wasWrong && <span>{t.legendExtra}</span>}
        </p>
      )}
    </div>
  );
}
