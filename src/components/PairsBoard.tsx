/**
 * The paired-associates board: boxes open one at a time on a symbol, close, and one symbol is asked for.
 *
 * Both stimulus and response surface — the symbol has to be seen *in* the box that will later be
 * tapped. Gate, learn, probe, frozen. During the probe the boxes are closed and identical; nothing on
 * them says what they held, and the probe symbol sits above the row. Once the answer is out every box
 * opens, so the reader can see what was where.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import FigureView, { describeFigure } from './FigureView';
import { dict, type Locale } from '../lib/i18n';
import type { Figure, Presentation } from '../lib/types';
import { encodeBox } from '../lib/generators/paired-associates';

interface Props {
  symbols: Figure[];
  order: number[];
  probe: number;
  presentation?: Presentation;
  reducedMotion?: boolean;
  locale: Locale;
  frozen: boolean;
  onRecallStart: () => void;
  onComplete: (tapped: string) => void;
}

type Phase = 'gate' | 'learn' | 'probe';

export default function PairsBoard({
  symbols,
  order,
  probe,
  presentation,
  reducedMotion,
  locale,
  frozen,
  onRecallStart,
  onComplete,
}: Props) {
  const t = dict(locale).gen.pairedAssociates;
  const [phase, setPhase] = useState<Phase>('gate');
  const [open, setOpen] = useState<number | null>(null);
  const [tapped, setTapped] = useState<number | null>(null);

  const stepMs = presentation?.stepMs ?? 1300;
  // As on every stream: the accommodation lengthens the blank between boxes, never the exposure.
  const gapMs = reducedMotion ? Math.max(600, (presentation?.gapMs ?? 300) * 2) : (presentation?.gapMs ?? 300);

  const key = `${order.join('|')}:${probe}`;
  useEffect(() => {
    setPhase('gate');
    setOpen(null);
    setTapped(null);
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
      setPhase('learn');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, frozen, key]);

  useEffect(() => {
    if (phase !== 'learn') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let at = 400;
    for (const index of order) {
      timers.push(setTimeout(() => setOpen(index), at));
      at += stepMs;
      timers.push(setTimeout(() => setOpen(null), at));
      at += gapMs;
    }
    timers.push(
      setTimeout(() => {
        setPhase('probe');
        recallRef.current();
      }, at),
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, key, stepMs, gapMs]);

  function tap(index: number) {
    if (frozen || phase !== 'probe' || tapped !== null) return;
    setTapped(index);
    completeRef.current(encodeBox(index));
  }

  const wasWrong = frozen && tapped !== probe;

  return (
    <div
      class="pairs"
      data-stimulus="pairs"
      data-testid="pairs-board"
      data-pairs-phase={frozen ? 'revealed' : phase}
    >
      <div class="pairs-status" role="status" aria-live="polite">
        {frozen ? (
          <span class="pairs-headline">{wasWrong ? t.revealWrong : t.revealRight}</span>
        ) : phase === 'gate' ? (
          <span class="subtle">{t.ready(symbols.length)}</span>
        ) : phase === 'learn' ? (
          <span class="pairs-headline">{t.watching}</span>
        ) : (
          <span class="pairs-headline">{t.probe}</span>
        )}
      </div>

      {/* The probe symbol, shown only once the boxes have closed — and kept up after the answer, so
          the reveal can be read against it. */}
      <div class="pairs-probe" data-testid="pairs-probe" hidden={phase !== 'probe' && !frozen}>
        <FigureView figure={symbols[probe]!} label={describeFigure(symbols[probe]!, locale)} />
      </div>

      <div class="pairs-row" data-pairs-boxes={symbols.length}>
        {symbols.map((symbol, index) => {
          const showing = frozen || open === index;
          return (
            <button
              key={index}
              type="button"
              class="pairs-box"
              data-testid={`pairs-box-${index + 1}`}
              data-pairs-open={showing ? 'true' : undefined}
              data-pairs-answer={frozen && index === probe ? 'true' : undefined}
              data-pairs-tapped={frozen && tapped === index ? 'true' : undefined}
              disabled={frozen || phase !== 'probe'}
              onClick={() => tap(index)}
              /* The position only. Naming the symbol here would read the answer to a screen reader. */
              aria-label={t.boxLabel(index + 1)}
            >
              {showing ? <FigureView figure={symbol} /> : null}
            </button>
          );
        })}
      </div>

      {phase === 'gate' && !frozen && (
        <div class="pairs-actions">
          <button type="button" class="btn btn-primary" data-testid="span-start" onClick={() => setPhase('learn')}>
            {t.start} <span aria-hidden="true">↵</span>
          </button>
        </div>
      )}
    </div>
  );
}
