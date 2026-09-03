/**
 * The reaction-time board: a start, an unpredictable wait, a signal, and a single press.
 *
 * Both the stimulus and the response surface, like the block-span board, and for the same reason:
 * the signal has to appear on the very target that will be pressed. It owns the whole lifecycle —
 * gate, wait, signal, then a frozen state that says how long the press took.
 *
 * ## What the board must not do
 *
 * - **Nothing may move during the wait.** A countdown, a pulse, a progress bar — anything that
 *   changes on screen is a cue to the moment the signal will come, and the wait exists to have no
 *   such cue. The targets sit still and dim until one of them is lit.
 * - **The signal is a fill, not a hue.** The lit target goes solid and ringed; a colour change alone
 *   would be invisible to some readers and slower to notice for all of them.
 * - **A press during the wait ends the trial.** It is recorded as a false start, not ignored: an
 *   ignored press would let a reader hammer the target until the signal arrived and record an
 *   impossibly short time.
 *
 * ## The clock
 *
 * The quiz's own response clock starts at `onRecallStart`, which fires with the signal, so the
 * latency the quiz records *is* the reaction time. The board also keeps its own copy of the two
 * timestamps, purely so it can show the number afterwards — the quiz has no readout for latency,
 * and on this format the latency is the point.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { dict, type Locale } from '../lib/i18n';
import type { Presentation } from '../lib/types';
import { encodeTarget, FALSE_START } from '../lib/generators/reaction-time';

interface Props {
  targets: number;
  lit: number;
  presentation?: Presentation;
  locale: Locale;
  frozen: boolean;
  /** Fires with the signal: the response clock starts here. */
  onRecallStart: () => void;
  /** Fires once, with the encoded press — a target position, or the false-start marker. */
  onComplete: (pressed: string) => void;
}

type Phase = 'gate' | 'wait' | 'go';

export default function ReactionBoard({
  targets,
  lit,
  presentation,
  locale,
  frozen,
  onRecallStart,
  onComplete,
}: Props) {
  const t = dict(locale).gen.reactionTime;
  const [phase, setPhase] = useState<Phase>('gate');
  const [pressed, setPressed] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const litAt = useRef<number | null>(null);
  const done = useRef(false);

  const key = `${targets}:${lit}:${presentation?.stepMs ?? 0}`;
  useEffect(() => {
    setPhase('gate');
    setPressed(null);
    setElapsedMs(null);
    litAt.current = null;
    done.current = false;
  }, [key]);

  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const recallRef = useRef(onRecallStart);
  recallRef.current = onRecallStart;

  // Enter arms the trial, like every other gated format. Space is deliberately *not* bound here.
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

  useEffect(() => {
    if (phase !== 'wait') return;
    const timer = setTimeout(() => {
      litAt.current = performance.now();
      setPhase('go');
      recallRef.current();
    }, presentation?.stepMs ?? 1500);
    return () => clearTimeout(timer);
  }, [phase, key]);

  function press(index: number) {
    if (frozen || done.current || phase === 'gate') return;
    done.current = true;
    setPressed(index);
    if (phase === 'wait') {
      /*
       * A false start. The response clock has not started, so it is started and stopped in the same
       * breath: the trial's latency is meaningless and is never read — medians are taken over correct
       * responses only — but the response has to exist to be scored wrong.
       */
      recallRef.current();
      completeRef.current(FALSE_START);
      return;
    }
    setElapsedMs(Math.round(performance.now() - (litAt.current ?? performance.now())));
    completeRef.current(encodeTarget(index));
  }

  const falseStarted = frozen && pressed !== null && litAt.current === null;
  const wrongTarget = frozen && !falseStarted && pressed !== lit;

  return (
    <div
      class="reaction"
      data-stimulus="reaction"
      data-testid="reaction-board"
      data-reaction-phase={frozen ? 'revealed' : phase}
    >
      <div class="reaction-status" role="status" aria-live="polite">
        {frozen ? (
          <span class="reaction-headline" data-testid="reaction-result">
            {falseStarted ? t.falseStart : wrongTarget ? t.wrongTarget : elapsedMs !== null ? t.result(elapsedMs) : ''}
          </span>
        ) : phase === 'gate' ? (
          <span class="subtle">{t.ready(targets)}</span>
        ) : phase === 'wait' ? (
          <span class="subtle">{t.waiting}</span>
        ) : (
          <span class="reaction-headline">{t.go}</span>
        )}
      </div>

      <div class="reaction-targets" data-reaction-targets={targets}>
        {Array.from({ length: targets }, (_, index) => (
          <button
            key={index}
            type="button"
            class="reaction-target"
            data-testid={`reaction-target-${index + 1}`}
            data-reaction-lit={(phase === 'go' || frozen) && index === lit ? 'true' : undefined}
            data-reaction-pressed={frozen && pressed === index ? 'true' : undefined}
            /* Pressable during the wait on purpose — a press then is a false start, and it has to register. */
            disabled={frozen || phase === 'gate'}
            onClick={() => press(index)}
            aria-label={t.targetLabel(index + 1)}
          />
        ))}
      </div>

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
