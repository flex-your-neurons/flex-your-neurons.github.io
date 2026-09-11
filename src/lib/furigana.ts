/**
 * Furigana for Japanese pages: kanji annotated with their reading, for a reader who is still
 * learning them.
 *
 * Applied to the rendered DOM rather than to the strings, because the strings are rendered as
 * text in two hundred places and ruby is markup. The table of readings is built at compile time
 * from the Japanese dictionary (see scripts/build-furigana.mjs); this module only looks words up.
 *
 * The one delicate point is the quiz, whose DOM belongs to Preact. Preact keeps a reference to each
 * text node it rendered and updates it in place, so a text node must never be replaced: instead it
 * is *emptied* and an annotated twin is inserted after it. When Preact later writes new text into
 * the original, the mutation observer sees it and rebuilds the twin; when Preact removes the
 * original, the twin goes with it. Preact never learns the twin exists, and never needs to.
 */
import readings from './furigana-ja.json';

export const STORAGE_KEY = 'iq:v1:furigana';

const KANJI = /[㐀-䶿一-鿿豈-﫿]/;
const KANA = /^[ぁ-ゟ゠-ヿ]$/;

/** Elements whose text is data, not prose: a seed, a key name, a number. Left alone. */
const SKIP = 'script, style, code, kbd, rt, rp, svg, textarea, input, [data-no-furigana]';

const table: Record<string, string> = readings;
/** Longest surface first, so 行列推理 is not split by 行列 matching first. */
const pattern = new RegExp(
  Object.keys(table)
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
  'g',
);

/**
 * `選ぶ` read `えらぶ` is annotated as 選(えら)ぶ, not 選ぶ(えらぶ): kana the word shares with its
 * reading at either end are okurigana, and the ruby belongs on the kanji between them.
 */
function rubyFor(surface: string, reading: string): Node {
  let start = 0;
  let end = surface.length;
  let rStart = 0;
  let rEnd = reading.length;
  while (start < end && KANA.test(surface[start]!) && surface[start] === reading[rStart]) {
    start++;
    rStart++;
  }
  while (end > start && KANA.test(surface[end - 1]!) && surface[end - 1] === reading[rEnd - 1]) {
    end--;
    rEnd--;
  }
  const frag = document.createDocumentFragment();
  if (start > 0) frag.append(surface.slice(0, start));
  const ruby = document.createElement('ruby');
  ruby.append(surface.slice(start, end));
  const rt = document.createElement('rt');
  rt.textContent = reading.slice(rStart, rEnd);
  ruby.append(rt);
  frag.append(ruby);
  if (end < surface.length) frag.append(surface.slice(end));
  return frag;
}

/** The annotated twin of a text: the text with every known word wrapped in ruby. */
function annotate(text: string): HTMLElement {
  const twin = document.createElement('span');
  twin.dataset.furigana = '';
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    if (m.index! > last) twin.append(text.slice(last, m.index));
    twin.append(rubyFor(m[0], table[m[0]]!));
    last = m.index! + m[0].length;
  }
  if (last < text.length) twin.append(text.slice(last));
  return twin;
}

interface Twin {
  span: HTMLElement;
  /** What the original said before it was emptied, to put back on the way out. */
  text: string;
}

const twins = new WeakMap<Text, Twin>();
/** Every emptied original, for `disable` — a WeakMap cannot be iterated. */
const originals = new Set<Text>();
let observer: MutationObserver | null = null;
/** Set while this module mutates, so the observer ignores its own work. */
let applying = false;

function eligible(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent || parent.closest(SKIP)) return false;
  if (parent.dataset.furigana !== undefined || parent.closest('[data-furigana]')) return false;
  return KANJI.test(node.data);
}

function attach(node: Text): void {
  const text = node.data;
  const span = annotate(text);
  node.after(span);
  node.data = '';
  twins.set(node, { span, text });
  originals.add(node);
}

function refresh(node: Text): void {
  const twin = twins.get(node);
  if (!twin) return;
  // Preact wrote new text into the original: rebuild the twin from it and empty it again.
  const text = node.data;
  if (text === '') return;
  const span = annotate(text);
  twin.span.replaceWith(span);
  twin.span = span;
  twin.text = text;
  node.data = '';
}

function detach(node: Text): void {
  const twin = twins.get(node);
  if (!twin) return;
  twin.span.remove();
  twins.delete(node);
  originals.delete(node);
}

function walk(root: Node): void {
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const found: Text[] = [];
  for (let n = it.nextNode(); n; n = it.nextNode()) {
    const text = n as Text;
    if (!twins.has(text) && eligible(text)) found.push(text);
  }
  for (const n of found) attach(n);
}

function handle(records: MutationRecord[]): void {
  if (applying) return;
  applying = true;
  try {
    for (const r of records) {
      if (r.type === 'characterData') {
        const node = r.target as Text;
        if (twins.has(node)) refresh(node);
        else if (eligible(node)) attach(node);
        continue;
      }
      for (const removed of r.removedNodes) {
        if (removed.nodeType === Node.TEXT_NODE) detach(removed as Text);
        else if (removed.nodeType === Node.ELEMENT_NODE) {
          const it = document.createTreeWalker(removed, NodeFilter.SHOW_TEXT);
          for (let n = it.nextNode(); n; n = it.nextNode()) detach(n as Text);
        }
      }
      for (const added of r.addedNodes) {
        if (added.nodeType === Node.TEXT_NODE) {
          const text = added as Text;
          if (!twins.has(text) && eligible(text)) attach(text);
        } else if (added.nodeType === Node.ELEMENT_NODE && !(added as HTMLElement).dataset.furigana) {
          walk(added);
        }
      }
    }
  } finally {
    applying = false;
  }
}

/** Annotates the page and keeps it annotated as it changes. */
export function enable(root: HTMLElement = document.body): void {
  if (observer) return;
  applying = true;
  try {
    walk(root);
  } finally {
    applying = false;
  }
  observer = new MutationObserver(handle);
  observer.observe(root, { childList: true, characterData: true, subtree: true });
  document.documentElement.dataset.furiganaOn = '';
}

/** Puts every original back and stops watching. */
export function disable(): void {
  observer?.disconnect();
  observer = null;
  applying = true;
  try {
    for (const node of [...originals]) {
      const twin = twins.get(node);
      if (twin) node.data = twin.text;
      detach(node);
    }
  } finally {
    applying = false;
  }
  delete document.documentElement.dataset.furiganaOn;
}

export function isEnabled(): boolean {
  return observer !== null;
}

export function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writePreference(on: boolean): void {
  try {
    if (on) localStorage.setItem(STORAGE_KEY, '1');
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private-browsing modes can throw; the toggle still works for this page.
  }
}
