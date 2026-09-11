/**
 * Japanese: a third locale, and the furigana switch that exists only there.
 */
import { expect, test } from '@playwright/test';
import { getItemText } from '../src/lib/generators';
import { dict } from '../src/lib/i18n';
import { answerCorrectly, clearAppStorage, expectedItem, practiceUrl, waitForQuiz, type DrillOptions } from './helpers';

const JA: DrillOptions = { seed: 'JATEST01', difficulty: 3, length: 2, locale: 'ja' };
const ja = dict('ja');

test.describe('Japanese content', () => {
  test('translates the navigation, the cards and the quiz', async ({ page }) => {
    await page.goto('ja/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
    await expect(page.getByTestId('nav-practice')).toHaveText(ja.nav.practice);
    await expect(page.getByTestId('lang-ja')).toHaveAttribute('aria-current', 'true');

    await page.goto('ja/practice/');
    await expect(page.getByTestId('practice-card-matrix')).toContainText(getItemText('matrix', 'ja').name);

    await page.goto(practiceUrl('matrix', JA));
    await waitForQuiz(page);
    const item = expectedItem('matrix', JA.seed, 0, JA.difficulty, 'ja');
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-locale', 'ja');
    await expect(page.getByTestId('prompt')).toHaveText(item.prompt);
  });

  test('the root chooser offers Japanese and the browser language selects it', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ja-JP' });
    const page = await context.newPage();
    await page.goto('./');
    await expect(page).toHaveURL(/\/ja\/$/);
    await context.close();
  });
});

test.describe('furigana', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('en/');
    await clearAppStorage(page);
  });

  test('is offered on Japanese pages only', async ({ page }) => {
    await page.goto('en/about/');
    await expect(page.getByTestId('furigana-toggle')).toHaveCount(0);
    await page.goto('ja/about/');
    await expect(page.getByTestId('furigana-toggle')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('main ruby')).toHaveCount(0);
  });

  test('annotates the kanji on the page, and takes the annotation back off', async ({ page }) => {
    await page.goto('ja/about/');
    const toggle = page.getByTestId('furigana-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-furigana-on', '');
    const rubies = page.locator('main ruby');
    expect(await rubies.count()).toBeGreaterThan(20);
    // A reading sits over the kanji it belongs to: 練習 reads れんしゅう.
    await expect(page.locator('main ruby', { hasText: '練習' }).first().locator('rt')).toHaveText('れんしゅう');
    // The text, read as text, is unchanged apart from the readings.
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText(ja.pages.about.title.slice(0, 2));

    await toggle.click();
    await expect(page.locator('main ruby')).toHaveCount(0);
    await expect(heading).toHaveText(ja.pages.about.title);
  });

  test('is remembered, and follows the quiz as it changes', async ({ page }) => {
    await page.goto('ja/about/');
    await page.getByTestId('furigana-toggle').click();

    await page.goto(practiceUrl('series-number', JA));
    await waitForQuiz(page);
    await expect(page.getByTestId('furigana-toggle')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('prompt').locator('ruby').first()).toBeVisible();
    // The prompt still reads as the prompt, readings aside.
    const prompt = expectedItem('series-number', JA.seed, 0, JA.difficulty, 'ja').prompt;
    const shown = await page.getByTestId('prompt').evaluate((el) => {
      const clone = el.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('rt').forEach((rt) => rt.remove());
      return clone.textContent ?? '';
    });
    expect(shown).toBe(prompt);

    // Preact swaps the item; the annotation follows without breaking the run.
    await answerCorrectly(page, 'series-number', JA, 0);
    await page.getByTestId('next').click();
    // `toHaveText` would read the rubies too; the readings sit inside the label's text.
    await expect(page.getByTestId('progress-label')).toContainText('2問');
    await expect(page.getByTestId('progress-label').locator('ruby').first()).toBeVisible();
    await expect(page.getByTestId('prompt').locator('ruby').first()).toBeVisible();
  });
});
