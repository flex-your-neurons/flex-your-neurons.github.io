/**
 * Builds the Japanese furigana table: every kanji-bearing word the Japanese dictionary contains,
 * mapped to its reading in hiragana.
 *
 *   node scripts/build-furigana.mjs        -> src/lib/furigana-ja.json
 *
 * The table is built from the *source text* of `src/lib/i18n/ja.ts` rather than from the rendered
 * strings, because most entries are functions and there is no finite set of arguments to call them
 * with. Tokenising the file tokenises every literal and template inside those functions, so the
 * table covers what the site can say; the interpolated values are numbers, invented nouns and
 * Latin letters, which need no reading.
 *
 * Kuromoji (MeCab's IPA dictionary in JavaScript) is a build-time dependency only: its 17 MB
 * dictionary never ships. What ships is this JSON, a few tens of kilobytes, loaded only on Japanese
 * pages and only when the reader turns furigana on.
 *
 * One surface form gets one reading — the one kuromoji produced most often across the file. Kanji
 * words with context-dependent readings (一, 人, 生) will therefore occasionally be annotated with
 * the commoner reading in the wrong place. That is the trade for a table instead of a tokeniser in
 * the browser, and it is a fair one for a reader who wants help with kanji rather than a lesson.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import kuromoji from 'kuromoji';

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(here, '../src/lib/i18n/ja.ts');
const TARGET = path.join(here, '../src/lib/furigana-ja.json');
const DICT_DIR = path.join(here, '../node_modules/kuromoji/dict');

const KANJI = /[㐀-䶿一-鿿豈-﫿]/;

/** Katakana to hiragana, code point by code point; kuromoji reports readings in katakana. */
function hiragana(katakana) {
  return katakana.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

const tokenizer = await new Promise((resolve, reject) => {
  kuromoji.builder({ dicPath: DICT_DIR }).build((err, t) => (err ? reject(err) : resolve(t)));
});

const source = await readFile(SOURCE, 'utf8');
/** Per surface, how often each reading was produced. */
const votes = new Map();
for (const token of tokenizer.tokenize(source)) {
  const surface = token.surface_form;
  if (!KANJI.test(surface)) continue;
  if (!token.reading || token.reading === '*') continue;
  const reading = hiragana(token.reading);
  const tally = votes.get(surface) ?? new Map();
  tally.set(reading, (tally.get(reading) ?? 0) + 1);
  votes.set(surface, tally);
}

const table = {};
for (const [surface, tally] of [...votes].sort(([a], [b]) => a.localeCompare(b, 'ja'))) {
  const [reading] = [...tally].sort((a, b) => b[1] - a[1])[0];
  table[surface] = reading;
}

await writeFile(TARGET, `${JSON.stringify(table)}\n`);
console.log(`furigana: ${Object.keys(table).length} words -> ${path.relative(process.cwd(), TARGET)}`);
