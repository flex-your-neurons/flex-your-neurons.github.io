/**
 * The number line: the response surface of the number-line format.
 *
 * A native range input does the work. It is the one control every platform already knows how to
 * drag, tap and drive from the keyboard, and it announces its value to a screen reader without any
 * help — so the estimate is placed the way the reader expects and the accessibility comes for free.
 * The line drawn under it is decoration; the value is the input's.
 *
 * Frozen, the board stops taking input and draws the target beside the reader's mark, with the miss
 * as a percentage of the line. That is the whole review of an estimate: not right or wrong, but by
 * how much and which way.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { dict, type Locale } from '../lib/i18n';
import { encodePosition, LINE_UNITS, withinTolerance } from '../lib/generators/number-line';

interface Props {
  min: number;
  max: number;
  label: string;
  /** The key, in thousandths — only read once frozen. */
  answerText: string;
  tolerance: number;
  locale: Locale;
  frozen: boolean;
  onRecallStart: () => void;
  onComplete: (position: string) => void;
}

export default function NumberLineBoard({
  min,
  max,
  label,
  answerText,
  tolerance,
  locale,
  frozen,
  onRecallStart,
  onComplete,
}: Props) {
  const t = dict(locale).gen.numberLine;
  const [position, setPosition] = useState(LINE_UNITS / 2);
  const [touched, setTouched] = useState(false);
  const done = useRef(false);

  // Reset only when the item changes, not on mount: an input event that arrives before the mount
  // effect has run must not be undone by it.
  const key = `${min}..${max}:${label}`;
  const lastKey = useRef(key);
  useEffect(() => {
    if (lastKey.current === key) return;
    lastKey.current = key;
    setPosition(LINE_UNITS / 2);
    setTouched(false);
    done.current = false;
  }, [key]);

  // Self-paced: the clock starts as soon as the line is on screen.
  const recallRef = useRef(onRecallStart);
  recallRef.current = onRecallStart;
  useEffect(() => {
    if (!frozen) recallRef.current();
  }, [key, frozen]);

  function place() {
    if (frozen || done.current || !touched) return;
    done.current = true;
    onComplete(encodePosition(position));
  }

  const target = Number(answerText);
  const hit = frozen && withinTolerance(answerText, encodePosition(position), tolerance);
  const missPct = Math.round(((position - target) / LINE_UNITS) * 100);
  const pct = (n: number) => `${(n / LINE_UNITS) * 100}%`;

  return (
    <div
      class="numline"
      data-stimulus="number-line"
      data-testid="numline-board"
      data-numline-phase={frozen ? 'revealed' : 'placing'}
      data-numline-position={String(position)}
    >
      <div class="numline-track" aria-hidden="true">
        <span class="numline-rule" />
        <span class="numline-end numline-end--min" />
        <span class="numline-end numline-end--max" />
        {frozen && (
          <>
            <span
              class="numline-band"
              style={{ left: pct(target - tolerance * LINE_UNITS), width: pct(2 * tolerance * LINE_UNITS) }}
            />
            <span class="numline-target" style={{ left: pct(target) }} data-testid="numline-target" />
          </>
        )}
        {(touched || frozen) && (
          <span class="numline-mark" data-hit={frozen ? String(hit) : undefined} style={{ left: pct(position) }} />
        )}
      </div>
      <input
        type="range"
        class="numline-input"
        data-testid="numline-input"
        min={0}
        max={LINE_UNITS}
        step={1}
        value={position}
        disabled={frozen}
        aria-label={t.inputLabel(label, min, max)}
        aria-valuetext={t.valueText(Math.round((position / LINE_UNITS) * 100))}
        onInput={(e) => {
          setPosition(Number((e.currentTarget as HTMLInputElement).value));
          setTouched(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            place();
          }
        }}
      />
      <div class="numline-labels" aria-hidden="true">
        <span class="numline-label">{min}</span>
        <span class="numline-label">{max}</span>
      </div>
      <div class="numline-actions">
        {frozen ? (
          <p class="subtle numline-result" data-testid="numline-result" role="status">
            {hit ? t.resultHit(Math.abs(missPct)) : missPct > 0 ? t.resultRight(missPct) : t.resultLeft(-missPct)}
          </p>
        ) : (
          <button type="button" class="btn btn-primary" data-testid="submit-numline" disabled={!touched} onClick={place}>
            {t.place}
          </button>
        )}
      </div>
    </div>
  );
}
