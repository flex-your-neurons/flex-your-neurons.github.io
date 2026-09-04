/**
 * The go/no-go board: one target, a run of signals on it, a press for the plain ones and none for the
 * crossed ones.
 *
 * Like the reaction board it owns the whole lifecycle — gate, run, frozen — because the signal has
 * to appear on the very surface that is pressed. Unlike it, a wrong press does not end the item: the
 * run plays to the end regardless, and the record of what was pressed is the response.
 *
 * ## The two signals
 *
 * A plain signal is the disc going solid; a crossed one is the disc with a bold X through it. Shape,
 * not hue, so the difference survives any colour vision — and the X is drawn in the same ink as the
 * ring so nothing about the crossed signal is fainter or slower to see than the plain one. If it were,
 * the withhold would get extra time and the measurement would be of noticing rather than of stopping.
 *
 * ## The window
 *
 * A press counts for the signal on screen, or for the one that has just left during the blank that
 * follows it — the blank is part of the response window, as it is in the lab. A second press on the
 * same signal is ignored. A press during the blank after a crossed signal is a commission, as it
 * should be: the decision to stop has to hold for the whole window, not only while the X is up.
 *
 * ## What a press looks like
 *
 * A ring, briefly, around the target. It says the press was registered and nothing else: it appears
 * for a press on a crossed signal exactly as for a plain one, so it is not a verdict — the reader is
 * being told that the board heard them, which they would otherwise have no way to know, since the
 * signal itself carries on unchanged and the record is not shown until the run is over. It is cleared
 * when the next signal comes up, so a press never marks the signal after it; and only the first press
 * within a window draws one, since a second press on the same signal changes nothing.
 *
 * ## The clock
 *
 * `onRecallStart` fires with the first signal. The quiz's latency for the item is therefore the run
 * length, which means nothing; the board keeps its own timestamps and shows the mean of the correct
 * presses afterwards, since that is the number this format exists to produce.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { dict, type Locale } from '../lib/i18n';
import { encodeRun, GAP_MS } from '../lib/generators/go-no-go';

interface Props {
  signals: boolean[];
  windowMs: number;
  locale: Locale;
  frozen: boolean;
  onRecallStart: () => void;
  onComplete: (record: string) => void;
}

type Phase = 'gate' | 'run';
type Showing = 'go' | 'stop' | 'gap';

export default function GoNoGoBoard({ signals, windowMs, locale, frozen, onRecallStart, onComplete }: Props) {
  const t = dict(locale).gen.goNoGo;
  const [phase, setPhase] = useState<Phase>('gate');
  const [index, setIndex] = useState(-1);
  const [showing, setShowing] = useState<Showing>('gap');
  const [pressed, setPressed] = useState<boolean[]>(() => signals.map(() => false));
  const [meanMs, setMeanMs] = useState<number | null>(null);
  const pressedRef = useRef<boolean[]>(signals.map(() => false));
  const latencies = useRef<number[]>([]);
  const shownAt = useRef(0);
  const indexRef = useRef(-1);
  const done = useRef(false);

  const key = `${signals.map((g) => (g ? 1 : 0)).join('')}:${windowMs}`;
  useEffect(() => {
    setPhase('gate');
    setIndex(-1);
    setShowing('gap');
    pressedRef.current = signals.map(() => false);
    setPressed(pressedRef.current);
    setMeanMs(null);
    latencies.current = [];
    indexRef.current = -1;
    done.current = false;
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
      setPhase('run');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, frozen, key]);

  // The run: signal, blank, signal, blank … then the record is handed over.
  useEffect(() => {
    if (phase !== 'run') return;
    let timer: ReturnType<typeof setTimeout>;
    const show = (i: number) => {
      indexRef.current = i;
      shownAt.current = performance.now();
      setIndex(i);
      setShowing(signals[i] ? 'go' : 'stop');
      if (i === 0) recallRef.current();
      timer = setTimeout(() => {
        setShowing('gap');
        timer = setTimeout(() => {
          if (i + 1 < signals.length) show(i + 1);
          else finish();
        }, GAP_MS);
      }, windowMs);
    };
    const finish = () => {
      if (done.current) return;
      done.current = true;
      indexRef.current = -1;
      const hits = latencies.current;
      setMeanMs(hits.length ? Math.round(hits.reduce((a, b) => a + b, 0) / hits.length) : null);
      completeRef.current(encodeRun(pressedRef.current));
    };
    show(0);
    return () => clearTimeout(timer);
  }, [phase, key]);

  function press() {
    if (frozen || done.current || phase !== 'run') return;
    const i = indexRef.current;
    if (i < 0 || pressedRef.current[i]) return;
    pressedRef.current = pressedRef.current.map((p, j) => (j === i ? true : p));
    setPressed(pressedRef.current);
    if (signals[i]) latencies.current.push(performance.now() - shownAt.current);
  }

  // Space presses during the run, since the lab task is a key press; Enter is the gate's key.
  useEffect(() => {
    if (phase !== 'run' || frozen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' || e.repeat) return;
      e.preventDefault();
      press();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, frozen, key]);

  /** True while a signal is being responded to — its window or the blank after it. */
  const live = phase === 'run' && !frozen && index >= 0;
  const commissions = frozen ? signals.filter((go, i) => !go && pressed[i]).length : 0;
  const omissions = frozen ? signals.filter((go, i) => go && !pressed[i]).length : 0;

  return (
    <div
      class="gonogo"
      data-stimulus="gonogo"
      data-testid="gonogo-board"
      data-gonogo-phase={frozen ? 'revealed' : phase}
      data-gonogo-index={phase === 'run' && !frozen && index >= 0 ? index : undefined}
      data-gonogo-signal={phase === 'run' && !frozen ? showing : undefined}
    >
      <div class="reaction-status" role="status" aria-live="polite">
        {frozen ? (
          <span class="reaction-headline" data-testid="gonogo-result">
            {commissions > 0
              ? t.commission(commissions)
              : omissions > 0
                ? t.omission(omissions)
                : meanMs !== null
                  ? t.result(meanMs)
                  : ''}
          </span>
        ) : phase === 'gate' ? (
          <span class="subtle">{t.ready}</span>
        ) : (
          <span class="subtle">{t.running(Math.max(index, 0) + 1, signals.length)}</span>
        )}
      </div>

      <div class="gonogo-stage">
        <button
          type="button"
          class="gonogo-target"
          data-testid="gonogo-target"
          data-gonogo-showing={phase === 'run' && !frozen ? showing : undefined}
          data-gonogo-pressed={live && pressed[index] ? 'true' : undefined}
          disabled={frozen || phase === 'gate'}
          onClick={press}
          aria-label={live && pressed[index] ? t.targetPressed : t.targetLabel}
        >
          <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <circle class="gonogo-disc" cx="50" cy="50" r="46" />
            <path class="gonogo-cross" d="M30 30L70 70M70 30L30 70" />
          </svg>
          {/* Keyed by the signal, so the ring replays on the next signal's press rather than
              sitting there from the last one. */}
          {live && pressed[index] ? <span class="gonogo-press" key={index} aria-hidden="true" /> : null}
        </button>
      </div>

      {frozen && (
        <ol class="gonogo-record" aria-label={t.recordLabel}>
          {signals.map((go, i) => (
            <li
              key={i}
              class="gonogo-mark"
              data-stop={go ? undefined : 'true'}
              data-pressed={pressed[i] ? 'true' : undefined}
              data-wrong={go !== pressed[i] ? 'true' : undefined}
              aria-label={t.markLabel(i + 1, go, pressed[i] ?? false)}
            />
          ))}
        </ol>
      )}

      {phase === 'gate' && !frozen && (
        <div class="reaction-actions">
          <button type="button" class="btn btn-primary" data-testid="span-start" onClick={() => setPhase('run')}>
            {t.start} <span aria-hidden="true">↵</span>
          </button>
        </div>
      )}
    </div>
  );
}
