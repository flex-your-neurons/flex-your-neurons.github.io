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
import { DISTRACTOR_GRID, DISTRACTOR_STEP_MS, encodeBox } from '../lib/generators/paired-associates';

interface Props {
  symbols: Figure[];
  order: number[];
  probe: number;
  /** Cells lit one at a time during the filled interval between the last box and the probe. */
  distractor: number[];
  presentation?: Presentation;
  reducedMotion?: boolean;
  locale: Locale;
  frozen: boolean;
  onRecallStart: () => void;
  onComplete: (tapped: string) => void;
}

type Phase = 'gate' | 'learn' | 'delay' | 'probe';

export default function PairsBoard({
  symbols,
  order,
  probe,
  distractor,
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
  const [lit, setLit] = useState<number | null>(null);
  const [hit, setHit] = useState(false);

  const stepMs = presentation?.stepMs ?? 1300;
  // As on every stream: the accommodation lengthens the blank between boxes, never the exposure.
  const gapMs = reducedMotion ? Math.max(600, (presentation?.gapMs ?? 300) * 2) : (presentation?.gapMs ?? 300);

  const key = `${order.join('|')}:${probe}`;
  useEffect(() => {
    setPhase('gate');
    setOpen(null);
    setTapped(null);
    setLit(null);
    setHit(false);
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
    timers.push(setTimeout(() => setPhase('delay'), at));
    return () => timers.forEach(clearTimeout);
  }, [phase, key, stepMs, gapMs]);

  /*
   * The filled interval: the grid lights its cells on a fixed schedule whatever the reader does, so
   * the interval is the same length for everyone — a reader who taps nothing has rehearsed through
   * seven seconds of moving target, which is harder than it sounds, and is the documented gap.
   */
  useEffect(() => {
    if (phase !== 'delay') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let at = 300;
    for (const cell of distractor) {
      timers.push(
        setTimeout(() => {
          setLit(cell);
          setHit(false);
        }, at),
      );
      at += DISTRACTOR_STEP_MS;
    }
    timers.push(
      setTimeout(() => {
        setLit(null);
        setPhase('probe');
        recallRef.current();
      }, at),
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, key]);

  function tapCell(cell: number) {
    if (phase !== 'delay' || cell !== lit) return;
    setHit(true);
  }

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
        ) : phase === 'delay' ? (
          <span class="pairs-headline">{t.delay}</span>
        ) : (
          <span class="pairs-headline">{t.probe}</span>
        )}
      </div>

      {/* The filled interval's grid. Its taps are acknowledged and not counted. */}
      {phase === 'delay' && !frozen && (
        <div
          class="pairs-distractor"
          data-testid="pairs-distractor"
          role="group"
          aria-label={t.distractorLabel}
          style={{ gridTemplateColumns: `repeat(${DISTRACTOR_GRID}, 1fr)` }}
        >
          {Array.from({ length: DISTRACTOR_GRID * DISTRACTOR_GRID }, (_, cell) => (
            <button
              key={cell}
              type="button"
              class="pairs-distractor-cell"
              data-testid={`pairs-distractor-${cell}`}
              data-lit={lit === cell ? 'true' : undefined}
              data-hit={lit === cell && hit ? 'true' : undefined}
              onClick={() => tapCell(cell)}
              aria-label={t.cellLabel(cell + 1)}
            />
          ))}
        </div>
      )}

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
