/**
 * The test page's island: the planner, or the run it planned.
 *
 * One component for both because the choice is made from the URL at mount and nowhere else. With no
 * run parameters the page is a planner — a time budget, a focus, one suggestion from the history —
 * whose Start button navigates to this same page with `?types=` set. With any run parameter present
 * (a shared seed, an explicit length, a planned list) the page is the runner, and `Quiz` reads the
 * parameters itself. Navigating rather than swapping state makes every run a URL: reloading resumes
 * the same plan on a fresh seed, and a link carries the plan to someone else.
 *
 * `client:only`, like the quiz: the history is in localStorage and the draw order is random, so a
 * server pass could not match the first client paint.
 */
import { useMemo, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import Quiz from './Quiz';
import { ALL_META, DOMAIN_ORDER, ITEM_TYPE_IDS } from '../lib/generators';
import { dict, type Locale } from '../lib/i18n';
import { localeHref } from '../lib/links';
import {
  adviseToday,
  BUDGET_MINUTES,
  encodeTypes,
  fullTestSeconds,
  planTest,
  type Focus,
} from '../lib/planner';
import { randomSeed } from '../lib/rng';
import { formatPercent } from '../lib/scoring';
import { $summary } from '../lib/store';
import type { ChcDomain } from '../lib/types';

interface Props {
  locale: Locale;
}

const RUN_PARAMS = ['seed', 'n', 'd', 'types'];

function hasRunParams(): boolean {
  if (typeof location === 'undefined') return false;
  const params = new URLSearchParams(location.search);
  return RUN_PARAMS.some((p) => params.has(p));
}

function sameFocus(a: Focus, b: Focus): boolean {
  return a.kind === b.kind && (a.kind !== 'domain' || b.kind !== 'domain' || a.domain === b.domain);
}

/** Minutes for a display: rounded up, and never "0 min" for a run that exists. */
function minutesOf(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

export default function TestPlanner({ locale }: Props) {
  const [run] = useState(hasRunParams);
  if (run) return <Quiz mode="test" types={ITEM_TYPE_IDS} locale={locale} />;
  return <Planner locale={locale} />;
}

function Planner({ locale }: Props) {
  const t = dict(locale);
  const p = t.pages.test.planner;
  const summary = useStore($summary);
  const advice = useMemo(() => adviseToday(summary), [summary]);

  const [minutes, setMinutes] = useState<number | null>(advice.minutes);
  const [focus, setFocus] = useState<Focus>(advice.focus);
  /*
   * Drawn once per page view. The plan is recomputed whenever the choice changes, and holding the
   * seed keeps the *same* draw under a changing budget — so moving from 10 to 15 minutes extends
   * the list the reader was looking at rather than dealing a different one.
   */
  const [planSeed] = useState(randomSeed);
  const plan = useMemo(() => planTest(minutes, focus, summary, planSeed), [minutes, focus, summary, planSeed]);

  const fullMinutes = minutesOf(fullTestSeconds(summary));
  const adviceInUse = minutes === advice.minutes && sameFocus(focus, advice.focus);
  const runHref = `${localeHref('test/')}?types=${encodeTypes(plan.types)}`;

  const domainLabel = (d: ChcDomain) => t.domains[d];
  const adviceText = (() => {
    switch (advice.kind) {
      case 'first':
        return p.advice.first;
      case 'fill':
        return p.advice.fill(advice.domains.map(domainLabel).join(', '));
      case 'weakest':
        return p.advice.weakest(domainLabel(advice.domain), formatPercent(advice.accuracy, locale));
      case 'stale':
        return p.advice.stale(
          domainLabel(advice.domain),
          new Date(advice.lastPlayedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
        );
    }
  })();

  const formatsIn = (d: ChcDomain) => ALL_META.filter((m) => m.domain === d).length;

  return (
    <div class="planner stack" data-testid="test-planner">
      <section class="card note note--accent planner-advice" data-testid="planner-advice" data-advice={advice.kind}>
        <h2 class="section-heading section-heading--xs">{p.adviceHeading}</h2>
        <p class="note-body">{adviceText}</p>
        {adviceInUse ? (
          <span class="pill" data-testid="planner-advice-in-use">
            {p.adviceInUse}
          </span>
        ) : (
          <button
            type="button"
            class="btn"
            data-testid="planner-use-advice"
            onClick={() => {
              setMinutes(advice.minutes);
              setFocus(advice.focus);
            }}
          >
            {p.useAdvice}
          </button>
        )}
      </section>

      <div class="planner-group" role="group" aria-labelledby="planner-budget-legend">
        <h2 class="section-heading section-heading--xs" id="planner-budget-legend">
          {p.budgetLegend}
        </h2>
        <div class="cluster chips">
          {BUDGET_MINUTES.map((m) => (
            <button
              type="button"
              class="chip"
              aria-pressed={minutes === m}
              data-testid={`budget-${m}`}
              onClick={() => setMinutes(m)}
            >
              {p.minutes(m)}
            </button>
          ))}
          <button
            type="button"
            class="chip"
            aria-pressed={minutes === null}
            data-testid="budget-full"
            title={p.fullHint(ITEM_TYPE_IDS.length, fullMinutes)}
            onClick={() => setMinutes(null)}
          >
            {p.full}
            <span class="chip-hint">{p.minutes(fullMinutes)}</span>
          </button>
        </div>
        {minutes === null && <p class="muted planner-hint">{p.fullHint(ITEM_TYPE_IDS.length, fullMinutes)}</p>}
      </div>

      {/* The full test is the registry in its own order, so a focus has nothing to choose. */}
      <div class="planner-group" role="group" aria-labelledby="planner-focus-legend" data-disabled={minutes === null}>
        <h2 class="section-heading section-heading--xs" id="planner-focus-legend">
          {p.focusLegend}
        </h2>
        <div class="cluster chips">
          <button
            type="button"
            class="chip"
            aria-pressed={focus.kind === 'mixed'}
            disabled={minutes === null}
            data-testid="focus-mixed"
            onClick={() => setFocus({ kind: 'mixed' })}
          >
            {p.mixed}
          </button>
          <button
            type="button"
            class="chip"
            aria-pressed={focus.kind === 'gaps'}
            disabled={minutes === null}
            data-testid="focus-gaps"
            onClick={() => setFocus({ kind: 'gaps' })}
          >
            {p.gaps}
          </button>
          {DOMAIN_ORDER.map((d) => (
            <button
              type="button"
              class="chip"
              aria-pressed={focus.kind === 'domain' && focus.domain === d}
              disabled={minutes === null}
              data-testid={`focus-${d}`}
              title={p.domainHint(formatsIn(d))}
              onClick={() => setFocus({ kind: 'domain', domain: d })}
            >
              {domainLabel(d)}
              <span class="chip-hint">{d}</span>
            </button>
          ))}
        </div>
        <p class="muted planner-hint">
          {focus.kind === 'mixed' && p.mixedHint}
          {focus.kind === 'gaps' && p.gapsHint}
          {focus.kind === 'domain' && p.domainHint(formatsIn(focus.domain))}
        </p>
      </div>

      <div class="card planner-preview" data-testid="planner-preview" data-items={String(plan.types.length)}>
        <div class="planner-preview-head">
          <strong class="planner-preview-count">
            {plan.types.length === 1
              ? p.previewOne(minutesOf(plan.estimatedSeconds))
              : p.preview(plan.types.length, minutesOf(plan.estimatedSeconds))}
          </strong>
          <ul class="cluster planner-domains" style="--cluster-gap: 0.4rem">
            {plan.perDomain
              .filter((x) => x.count > 0)
              .map((x) => (
                <li class="pill" data-testid={`plan-domain-${x.domain}`}>
                  {p.perDomain(domainLabel(x.domain), x.count)}
                </li>
              ))}
          </ul>
        </div>
        <a class="btn btn-primary btn-lg" href={runHref} data-testid="planner-start">
          {p.start}
        </a>
      </div>
    </div>
  );
}
