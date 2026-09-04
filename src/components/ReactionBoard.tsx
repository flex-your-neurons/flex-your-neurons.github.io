/**
 * The reaction-time board: a start, then five trials — an unpredictable wait, a signal, a press —
 * and a median at the end.
 *
 * Both the stimulus and the response surface, like the block-span board, and for the same reason:
 * the signal has to appear on the very target that will be pressed. It owns the whole lifecycle —
 * gate, then wait/signal/pause for each trial, then a frozen state that says how the block went.
 *
 * ## What the board must not do
 *
 * - **Nothing may move during a wait.** A countdown, a pulse, a progress bar — anything that
 *   changes on screen is a cue to the moment the signal will come, and the wait exists to have no
 *   such cue. The trial counter changes only at a trial boundary, and the targets sit still and dim
 *   until one of them is lit.
 * - **The signal is a fill, not a hue.** The lit target goes solid and ringed; a colour change alone
 *   would be invisible to some readers and slower to notice for all of them.
 * - **A press during a wait ends that trial.** It is recorded as a false start, not ignored: an
 *   ignored press would let a reader hammer the target until the signal arrived and record an
 *   impossibly short time. The block goes on to the next trial regardless.
 *
 * ## The clock
 *
 * The quiz's response clock starts at `onRecallStart`, which fires with the first signal — but the
 * latency the quiz would record from there is the length of the block, which is not the measurement.
 * The board times each trial itself and hands the quiz the median of the correct ones as the item's
 * latency, which is the number the lab reports and the one the progress page should plot.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { dict, type Locale } from '../lib/i18n';
import { encodeBlock, INTER_TRIAL_MS, type ReactionTrial } from '../lib/generators/reaction-time';

interface Props {
  targets: number;
  trials: ReactionTrial[];
  locale: Locale;
  frozen: boolean;
  /** Fires with the first signal: the quiz's response clock starts here. */
  onRecallStart: () => void;
  /** Fires once, with the encoded block and the median latency of its correct trials, if any. */
  onComplete: (pressed: string, medianMs?: number) => void;
}

type Phase = 'gate' | 'wait' | 'go' | 'pause';

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export default function ReactionBoard({ targets, trials, locale, frozen, onRecallStart, onComplete }: Props) {
  const t = dict(locale).gen.reactionTime;
  const [phase, setPhase] = useState<Phase>('gate');
  const [trial, setTrial] = useState(0);
  const [pressed, setPressed] = useState<(number | null)[]>([]);
  const [medianMs, setMedianMs] = useState<number | null>(null);
  const pressedRef = useRef<(number | null)[]>([]);
  const latencies = useRef<number[]>([]);
  const litAt = useRef<number | null>(null);
  const trialRef = useRef(0);
  const done = useRef(false);

  const key = `${targets}:${trials.map((x) => `${x.lit}@${x.foreperiodMs}`).join(',')}`;
  useEffect(() => {
    setPhase('gate');
    setTrial(0);
    setPressed([]);
    setMedianMs(null);
    pressedRef.current = [];
    latencies.current = [];
    litAt.current = null;
    trialRef.current = 0;
    done.current = false;
  }, [key]);

  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const recallRef = useRef(onRecallStart);
  recallRef.current = onRecallStart;

  // Enter arms the block, like every other gated format. Space is deliberately *not* bound here.
  useEffect(() => {
    if (phase !== 'gate' || frozen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat) return;
      e.preventDefault();
      setPhase('wait');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, frozen, key]);

  // A wait ends with the signal.
  useEffect(() => {
    if (phase !== 'wait') return;
    const wait = trials[trialRef.current]?.foreperiodMs ?? 1500;
    const timer = setTimeout(() => {
      litAt.current = performance.now();
      setPhase('go');
      if (trialRef.current === 0) recallRef.current();
    }, wait);
    return () => clearTimeout(timer);
  }, [phase, trial, key]);

  // A pause ends with the next wait, or with the block.
  useEffect(() => {
    if (phase !== 'pause') return;
    const timer = setTimeout(() => {
      const next = trialRef.current + 1;
      if (next < trials.length) {
        trialRef.current = next;
        litAt.current = null;
        setTrial(next);
        setPhase('wait');
      } else {
        done.current = true;
        const med = median(latencies.current);
        setMedianMs(med ?? null);
        completeRef.current(encodeBlock(pressedRef.current), med);
      }
    }, INTER_TRIAL_MS);
    return () => clearTimeout(timer);
  }, [phase, trial, key]);

  function press(index: number) {
    if (frozen || done.current || phase === 'gate' || phase === 'pause') return;
    const i = trialRef.current;
    if (phase === 'wait') {
      // A false start: recorded as such, and the block moves on.
      pressedRef.current = [...pressedRef.current, null];
    } else {
      pressedRef.current = [...pressedRef.current, index];
      if (index === trials[i]?.lit) latencies.current.push(performance.now() - (litAt.current ?? performance.now()));
    }
    setPressed(pressedRef.current);
    setPhase('pause');
  }

  const falseStarts = pressed.filter((p) => p === null).length;
  const wrongTargets = pressed.filter((p, i) => p !== null && p !== trials[i]?.lit).length;
  const current = trials[trial];

  return (
    <div
      class="reaction"
      data-stimulus="reaction"
      data-testid="reaction-board"
      data-reaction-phase={frozen ? 'revealed' : phase}
      data-reaction-trial={frozen || phase === 'gate' ? undefined : trial}
    >
      <div class="reaction-status" role="status" aria-live="polite">
        {frozen ? (
          <span class="reaction-headline" data-testid="reaction-result">
            {falseStarts > 0
              ? t.falseStarts(falseStarts)
              : wrongTargets > 0
                ? t.wrongTargets(wrongTargets)
                : medianMs !== null
                  ? t.result(medianMs, trials.length)
                  : ''}
          </span>
        ) : phase === 'gate' ? (
          <span class="subtle">{t.ready(targets, trials.length)}</span>
        ) : phase === 'go' ? (
          <span class="reaction-headline">{t.go}</span>
        ) : (
          <span class="subtle">{t.trial(trial + 1, trials.length)}</span>
        )}
      </div>

      <div class="reaction-targets" data-reaction-targets={targets}>
        {Array.from({ length: targets }, (_, index) => (
          <button
            key={index}
            type="button"
            class="reaction-target"
            data-testid={`reaction-target-${index + 1}`}
            data-reaction-lit={phase === 'go' && !frozen && index === current?.lit ? 'true' : undefined}
            /* Pressable during the wait on purpose — a press then is a false start, and it has to register. */
            disabled={frozen || phase === 'gate' || phase === 'pause'}
            onClick={() => press(index)}
            aria-label={t.targetLabel(index + 1)}
          />
        ))}
      </div>

      {frozen && (
        <ol class="reaction-record" aria-label={t.recordLabel}>
          {trials.map((x, i) => {
            const p = pressed[i];
            const ok = p === x.lit;
            return (
              <li
                key={i}
                class="reaction-mark"
                data-ok={ok ? 'true' : undefined}
                data-false-start={p === null ? 'true' : undefined}
                aria-label={t.markLabel(i + 1, x.lit + 1, p === null || p === undefined ? null : p + 1)}
              >
                {p === null || p === undefined ? '!' : ok ? '✓' : p + 1}
              </li>
            );
          })}
        </ol>
      )}

      {phase === 'gate' && !frozen && (
        <div class="reaction-actions">
          <button type="button" class="btn btn-primary" data-testid="span-start" onClick={() => setPhase('wait')}>
            {t.start} <span aria-hidden="true">↵</span>
          </button>
        </div>
      )}
    </div>
  );
}
