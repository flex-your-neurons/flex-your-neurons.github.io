import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  dict,
  en,
  fr,
  isLocale,
  LOCALES,
  localeFromPath,
  localeOptions,
  negotiateLocale,
  pathForLocale,
} from '@/lib/i18n';
import { generateItem, getItemText, ITEM_TYPE_IDS } from '@/lib/generators';
import { formatDuration, formatPercent } from '@/lib/scoring';
import { DIFFICULTIES } from '@/lib/types';
import type { Locale } from '@/lib/i18n';
import type { Item, Option, Stimulus } from '@/lib/types';

const SEEDS = Array.from({ length: 30 }, (_, i) => `L${i}`);

// ---------------------------------------------------------------------------
// Dictionary completeness
// ---------------------------------------------------------------------------

type Shape = { [key: string]: 'string' | 'function' | 'array' | Shape };

/** Records the type of every leaf, so two dictionaries can be compared structurally. */
function shapeOf(value: unknown, path = ''): Shape {
  const out: Shape = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    const here = path ? `${path}.${key}` : key;
    if (typeof v === 'function') out[here] = 'function';
    else if (typeof v === 'string') out[here] = 'string';
    else if (Array.isArray(v)) out[here] = 'array';
    else if (v && typeof v === 'object') Object.assign(out, shapeOf(v, here));
    else out[here] = 'string';
  }
  return out;
}

function leafStrings(value: unknown, path = '', into: [string, string][] = []): [string, string][] {
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    const here = path ? `${path}.${key}` : key;
    if (typeof v === 'string') into.push([here, v]);
    else if (Array.isArray(v)) {
      v.forEach((entry, i) => {
        if (typeof entry === 'string') into.push([`${here}[${i}]`, entry]);
        else if (entry && typeof entry === 'object') leafStrings(entry, `${here}[${i}]`, into);
      });
    } else if (v && typeof v === 'object') leafStrings(v, here, into);
  }
  return into;
}

describe('dictionaries', () => {
  /**
   * TypeScript already forces `fr` to satisfy the shape inferred from `en`, so this test
   * exists for what the type system cannot see: keys that exist but were never actually
   * translated, and arrays that lost or gained an entry.
   */
  /** Every dictionary but the English one, which is the shape the others are checked against. */
  const OTHERS = LOCALES.filter((l) => l !== 'en').map((l) => [l, dict(l)] as const);

  it('have identical structure in every locale', () => {
    for (const [locale, d] of OTHERS) expect(shapeOf(d), locale).toEqual(shapeOf(en));
  });

  it.each(OTHERS)('have arrays of matching length (%s)', (_locale, d) => {
    const enPage = en.pages;
    const frPage = d.pages;
    expect(frPage.home.how).toHaveLength(enPage.home.how.length);
    expect(frPage.test.differs).toHaveLength(enPage.test.differs.length);
    expect(frPage.about.families).toHaveLength(enPage.about.families.length);
    expect(frPage.about.guards).toHaveLength(enPage.about.guards.length);
    expect(frPage.about.limits).toHaveLength(enPage.about.limits.length);
    expect(frPage.about.sources).toHaveLength(enPage.about.sources.length);
    expect(frPage.about.notMeasured).toHaveLength(enPage.about.notMeasured.length);
    expect(frPage.about.procedureList).toHaveLength(enPage.about.procedureList.length);
    expect(frPage.terms.sections).toHaveLength(enPage.terms.sections.length);
    frPage.terms.sections.forEach((section, i) => {
      expect(section.body, `terms section ${i + 1}`).toHaveLength(
        enPage.terms.sections[i]!.body.length,
      );
    });
  });

  it.each(OTHERS)('leave no user-facing string untranslated (%s)', (_locale, d) => {
    const enStrings = new Map(leafStrings(en));
    const frStrings = new Map(leafStrings(d));
    expect(frStrings.size).toBe(enStrings.size);

    /**
     * Values that are deliberately identical in both languages. Every entry here was
     * checked by hand; the point of the list is that a *new* identical string is a
     * failure until someone has decided it should be.
     */
    const ALLOWED_IDENTICAL = new Set([
      // The product name.
      'nav.brand',
      // "Test" is the French word too, on the nav and on the page.
      'nav.test',
      'pages.test.title',
      // French–English cognates that are spelled identically.
      'quiz.correct', // "Correct" is the French word too
      'quiz.shapeNames.triangle',
      'results.colType',
      'dashboard.colType',
      'dashboard.sessions',
      'diagnosis.tags.correct', // "correct" is the French word too
      'pages.about.chcColCode', // "Code"
      'pages.about.sourcesHeading', // "Sources"
      // Facts that do not translate.
      'pages.terms.host', // postal address
      'pages.terms.contact', // URL
      'pages.terms.publisher', // placeholder until the owner supplies a name
      'pages.terms.contactLabel', // "Contact" is the same word in French
      // The mascot's name, which is a proper noun — and happens to be the French word as well.
      'mascot.name',
      // Proper nouns: the names of published test batteries.
      'pages.about.families[1].name', // Stanford–Binet 5
      'pages.about.families[3].name', // Cattell Culture Fair (CFIT)
      'pages.about.families[4].name', // Woodcock–Johnson IV
      // Japanese keeps the placeholders and the address as they are, like French.
      'pages.about.families[0].name', // Wechsler (WAIS / WISC)
      'pages.about.families[2].name', // Raven's Progressive Matrices
    ]);

    const untranslated: string[] = [];
    for (const [key, value] of enStrings) {
      if (ALLOWED_IDENTICAL.has(key)) continue;
      // Short tokens and pure punctuation carry no language.
      if (value.trim().length <= 2) continue;
      if (frStrings.get(key) === value) untranslated.push(`${key} = "${value}"`);
    }
    expect(untranslated, `${_locale} still in English:\n${untranslated.join('\n')}`).toEqual([]);
  });

  it('name every item type in every locale', () => {
    for (const locale of LOCALES) {
      for (const id of ITEM_TYPE_IDS) {
        const text = getItemText(id, locale);
        // Japanese says in a third of the characters what Latin scripts say in eighty: 数列 is a name.
        const dense = locale === 'ja';
        expect(text.name.length, `${id} ${locale}`).toBeGreaterThan(dense ? 1 : 2);
        expect(text.description.length, `${id} ${locale}`).toBeGreaterThan(dense ? 30 : 80);
      }
    }
    // The translated names really are different words.
    for (const [locale] of OTHERS) {
      for (const id of ITEM_TYPE_IDS) {
        if (id === 'syllogism' && locale === 'fr') continue; // "Syllogismes" vs "Syllogisms" — close but distinct
        expect(getItemText(id, locale).name, `${id} ${locale}`).not.toBe(getItemText(id, 'en').name);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Locale must never change what the item IS
// ---------------------------------------------------------------------------

/** Strips every language-dependent string, leaving the item's structure. */
function structure(item: Item) {
  return {
    type: item.type,
    seed: item.seed,
    difficulty: item.difficulty,
    responseMode: item.responseMode,
    answerIndex: item.answerIndex,
    answerText: item.answerText,
    errorTypes: item.errorTypes,
    suggestedSeconds: item.suggestedSeconds,
    presentation: item.presentation,
    optionShapes: item.options.map(optionShape),
    stimulus: stimulusShape(item.stimulus),
  };
}

function optionShape(option: Option): unknown {
  // Text options are the only place a translation can legitimately change an option.
  return option.kind === 'text' ? { kind: 'text' } : option;
}

function stimulusShape(stimulus: Stimulus): unknown {
  if (stimulus.kind === 'text') return { kind: 'text', lines: stimulus.lines.length };
  return stimulus;
}

describe('locale independence', () => {
  /**
   * The load-bearing property of the whole design: a seed identifies an item, and the
   * language only decides how it is described. If locale leaked into the RNG, a seed
   * shared between an English and a French reader would give them different tests.
   */
  it('produces structurally identical items in every locale', () => {
    for (const id of ITEM_TYPE_IDS) {
      for (const difficulty of DIFFICULTIES) {
        for (const seed of SEEDS) {
          const english = generateItem(id, seed, difficulty, 'en');
          for (const locale of LOCALES) {
            if (locale === 'en') continue;
            const other = generateItem(id, seed, difficulty, locale);
            expect(structure(other), `${id} ${seed} d${difficulty} ${locale}`).toEqual(structure(english));
          }
        }
      }
    }
  });

  it('keeps the figures byte-identical across locales', () => {
    for (const id of ITEM_TYPE_IDS) {
      for (const seed of SEEDS.slice(0, 10)) {
        const english = generateItem(id, seed, 4, 'en');
        const french = generateItem(id, seed, 4, 'fr');
        const figuresOf = (item: Item) =>
          JSON.stringify(item.options.filter((o) => o.kind !== 'text'));
        expect(figuresOf(french), id).toBe(figuresOf(english));
      }
    }
  });

  it('actually translates the prompt and the explanation', () => {
    for (const id of ITEM_TYPE_IDS) {
      const english = generateItem(id, 'XLATE', 3, 'en');
      for (const locale of LOCALES) {
        if (locale === 'en') continue;
        const other = generateItem(id, 'XLATE', 3, locale);
        expect(other.prompt, `${id} ${locale} prompt`).not.toBe(english.prompt);
        expect(other.explanation.summary, `${id} ${locale} summary`).not.toBe(english.explanation.summary);
        expect(other.explanation.rules.length, `${id} ${locale}`).toBe(english.explanation.rules.length);
      }
    }
  });

  it('translates the syllogism premises and options', () => {
    const english = generateItem('syllogism', 'SYLLO', 3, 'en');
    const french = generateItem('syllogism', 'SYLLO', 3, 'fr');

    if (english.stimulus.kind !== 'text' || french.stimulus.kind !== 'text') {
      throw new Error('unexpected stimulus');
    }
    for (const line of english.stimulus.lines) expect(line).toMatch(/^(All|No|Some)\b/);
    for (const line of french.stimulus.lines) expect(line).toMatch(/^(Tous|Aucun|Certains)\b/);

    // The French E form needs a singular ("Aucun Blick n'est un Zorn"), which only works
    // because every invented term is a plural ending in "s".
    const eForm = french.stimulus.lines.find((l) => l.startsWith('Aucun'));
    if (eForm) expect(eForm).toMatch(/^Aucun \w+ n’est un \w+\.$/);
  });

  it('uses invented terms that can be singularised for French', () => {
    // Every term the syllogism generator can draw must end in "s", or the French E form
    // ("Aucun X n'est un Y") would read as a plural and lose agreement.
    const seen = new Set<string>();
    for (const seed of SEEDS) {
      const item = generateItem('syllogism', seed, 3, 'en');
      if (item.stimulus.kind !== 'text') continue;
      for (const line of item.stimulus.lines) {
        for (const word of line.replace(/[.]/g, '').split(/\s+/)) {
          if (/^[A-Z][a-z]+s$/.test(word) || /^[A-Z][a-z]+$/.test(word)) seen.add(word);
        }
      }
    }
    const terms = [...seen].filter((w) => !['All', 'No', 'Some'].includes(w));
    expect(terms.length).toBeGreaterThan(5);
    for (const term of terms) expect(term, `${term} has no plural "s"`).toMatch(/s$/);
  });
});

// ---------------------------------------------------------------------------
// Locale helpers
// ---------------------------------------------------------------------------

describe('locale helpers', () => {
  it('recognises supported locales only', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(true);
    expect(isLocale('ja')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('falls back rather than throwing on an unknown locale', () => {
    expect(dict('de' as Locale)).toBe(dict(DEFAULT_LOCALE));
    expect(dict(undefined)).toBe(dict(DEFAULT_LOCALE));
  });

  /*
   * Both deployment shapes: the site is served at the origin root, and a fork under a project
   * page's `/<name>/` still has to work — which is what the `base` argument is for.
   */
  it('reads the locale out of a path', () => {
    expect(localeFromPath('/fr/practice/matrix/', '/')).toBe('fr');
    expect(localeFromPath('/en/', '/')).toBe('en');
    expect(localeFromPath('/', '/')).toBe(DEFAULT_LOCALE);
    expect(localeFromPath('/flex-your-neurons/fr/practice/matrix/', '/flex-your-neurons/')).toBe('fr');
    expect(localeFromPath('/flex-your-neurons/en/', '/flex-your-neurons/')).toBe('en');
    expect(localeFromPath('/flex-your-neurons/', '/flex-your-neurons/')).toBe(DEFAULT_LOCALE);
    expect(localeFromPath('/fr/about/', '/')).toBe('fr');
  });

  it('swaps the locale while keeping the page', () => {
    expect(pathForLocale('/en/practice/matrix/', 'fr', '/')).toBe('/fr/practice/matrix/');
    expect(pathForLocale('/fr/about/', 'en', '/')).toBe('/en/about/');
    expect(pathForLocale('/', 'fr', '/')).toBe('/fr/');
    expect(pathForLocale('/flex-your-neurons/en/practice/matrix/', 'fr', '/flex-your-neurons/')).toBe('/flex-your-neurons/fr/practice/matrix/');
    expect(pathForLocale('/flex-your-neurons/fr/about/', 'en', '/flex-your-neurons/')).toBe('/flex-your-neurons/en/about/');
    expect(pathForLocale('/flex-your-neurons/en/', 'fr', '/flex-your-neurons/')).toBe('/flex-your-neurons/fr/');
    // A path with no locale yet gains one.
    expect(pathForLocale('/flex-your-neurons/', 'fr', '/flex-your-neurons/')).toBe('/flex-your-neurons/fr/');
  });

  it('negotiates from a browser language list', () => {
    expect(negotiateLocale(['fr-CA', 'en-US'])).toBe('fr');
    expect(negotiateLocale(['en-GB'])).toBe('en');
    expect(negotiateLocale(['de-DE', 'fr'])).toBe('fr');
    expect(negotiateLocale(['de-DE'])).toBe(DEFAULT_LOCALE);
    expect(negotiateLocale([])).toBe(DEFAULT_LOCALE);
  });

  it('lists every locale with its own name', () => {
    const options = localeOptions();
    expect(options.map((o) => o.locale)).toEqual([...LOCALES]);
    expect(options.find((o) => o.locale === 'fr')?.nativeName).toBe('Français');
    expect(options.find((o) => o.locale === 'ja')?.nativeName).toBe('日本語');
  });
});

describe('number formatting', () => {
  it('follows each locale’s conventions', () => {
    // French uses a comma for the decimal separator and a space before the percent sign.
    expect(formatDuration(1400, 'en')).toBe('1.4 s');
    expect(formatDuration(1400, 'fr')).toBe('1,4 s');

    expect(formatPercent(0.67, 'en')).toBe('67%');
    expect(formatPercent(0.67, 'fr')).toMatch(/^67\s%$/);
  });

  it('renders a missing value as an em dash in both locales', () => {
    expect(formatDuration(null, 'en')).toBe('—');
    expect(formatPercent(null, 'fr')).toBe('—');
  });
});
