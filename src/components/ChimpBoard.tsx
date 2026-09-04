/**
 * The chimp-test board: numerals scattered on a grid, gone at the first tap, tapped back in order.
 *
 * The board is both stimulus and response surface, as for block span, and it owns its lifecycle:
 * `study` (numerals showing, untimed), `recall` (masked, collecting taps), and frozen. The first tap
 * is the transition — it is a tap like any other, counted in the sequence, and it is also the moment
 * the numbers go and the response clock starts.
 *
 * ## What the board must not do
 *
 * - **Give no verdict during recall.** A tapped cell looks the same as an untapped one, and nothing
 *   says whether the tap was right. Either would turn recall into recognition.
 * - **Never mask selectively.** Every numeral goes at the first tap, the 1 included: the reader holds
 *   the whole layout or none of it.
 *
 * The frozen state shows the numerals again with the tapped order alongside, so the reader can see
 * where the sequence went wrong.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { dict, type Locale } from '../lib/i18n';
import { encodeCells } from '../lib/generators/chimp-test';

interface Props {
  cols: number;
  rows: number;
  /** `cells[i]` is the grid index holding numeral `i + 1`. */
  cells: number[];
  locale: Locale;
  frozen: boolean;
  onRecallStart: () => void;
  onComplete: (tapped: string) => void;
}

type Phase = 'study' | 'recall';

export default function ChimpBoard({ cols, rows, cells, locale, frozen, onRecallStart, onComplete }: Props) {
  const t = dict(locale).gen.chimpTest;
  const [phase, setPhase] = useState<Phase>('study');
  const [taps, setTaps] = useState<number[]>([]);
  const done = useRef(false);

  const key = `${cols}x${rows}:${cells.join(',')}`;
  useEffect(() => {
    setPhase('study');
    setTaps([]);
    done.current = false;
  }, [key]);

  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const recallRef = useRef(onRecallStart);
  recallRef.current = onRecallStart;

  const numeralAt = new Map(cells.map((cell, i) => [cell, i + 1]));

  function tap(index: number) {
    if (frozen || done.current) return;
    if (phase === 'study') {
      setPhase('recall');
      recallRef.current();
    }
    const next = [...taps, index];
    setTaps(next);
    if (next.length === cells.length) {
      done.current = true;
      completeRef.current(encodeCells(next));
    }
  }

  const tappedOrder = new Map<number, number>();
  if (frozen) taps.forEach((cell, i) => tappedOrder.set(cell, i + 1));

  return (
    <div
      class="chimp"
      data-stimulus="chimp"
      data-testid="chimp-board"
      data-chimp-phase={frozen ? 'revealed' : phase}
      data-chimp-taps={String(taps.length)}
    >
      <div class="reaction-status" role="status" aria-live="polite">
        {frozen ? (
          <span class="subtle">{t.reveal}</span>
        ) : phase === 'study' ? (
          <span class="subtle">{t.study}</span>
        ) : (
          <span class="subtle" data-testid="chimp-count">
            {t.progress(taps.length, cells.length)}
          </span>
        )}
      </div>

      <div class="chimp-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} data-chimp-cols={cols}>
        {Array.from({ length: cols * rows }, (_, index) => {
          const numeral = numeralAt.get(index);
          const showNumeral = numeral !== undefined && (phase === 'study' || frozen);
          const tapped = tappedOrder.get(index);
          return (
            <button
              key={index}
              type="button"
              class="chimp-cell"
              data-testid={`chimp-cell-${index}`}
              data-chimp-numbered={numeral !== undefined && phase === 'study' && !frozen ? 'true' : undefined}
              data-chimp-masked={phase === 'recall' && !frozen ? 'true' : undefined}
              data-chimp-answer={frozen && numeral !== undefined ? String(numeral) : undefined}
              data-chimp-tapped={tapped !== undefined ? String(tapped) : undefined}
              data-chimp-wrong={frozen && tapped !== undefined && tapped !== numeral ? 'true' : undefined}
              disabled={frozen}
              onClick={() => tap(index)}
              aria-label={
                frozen
                  ? t.cellReveal(index + 1, numeral, tapped)
                  : showNumeral
                    ? t.cellNumbered(numeral)
                    : t.cellLabel(index + 1)
              }
            >
              {showNumeral ? <span class="chimp-numeral">{numeral}</span> : null}
              {frozen && tapped !== undefined && tapped !== numeral ? (
                <span class="chimp-tapped" aria-hidden="true">
                  {tapped}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
