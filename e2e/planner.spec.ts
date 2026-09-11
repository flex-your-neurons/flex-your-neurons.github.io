/**
 * The test planner: a time budget and a focus become a run, and the run is a URL.
 */
import { expect, test } from '@playwright/test';
import { DOMAIN_ORDER, getMeta, ITEM_TYPE_IDS } from '../src/lib/generators';
import { dict } from '../src/lib/i18n';
import { clearAppStorage, waitForQuiz } from './helpers';

test.describe('test planner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('en/');
    await clearAppStorage(page);
  });

  test('offers a suggestion, a budget and a focus, and no quiz until asked', async ({ page }) => {
    await page.goto('en/test/');
    await expect(page.getByTestId('test-planner')).toBeVisible();
    await expect(page.getByTestId('quiz')).toHaveCount(0);

    // A newcomer is pointed at a mixed sitting, and that is what is preselected.
    await expect(page.getByTestId('planner-advice')).toHaveAttribute('data-advice', 'first');
    await expect(page.getByTestId('planner-advice-in-use')).toBeVisible();
    await expect(page.getByTestId('budget-10')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('focus-mixed')).toHaveAttribute('aria-pressed', 'true');
    for (const d of DOMAIN_ORDER) await expect(page.getByTestId(`focus-${d}`)).toBeVisible();
  });

  test('a budget bounds the run and a domain focus confines it', async ({ page }) => {
    await page.goto('en/test/');
    await page.getByTestId('budget-5').click();
    await page.getByTestId('focus-Gv').click();
    // Leaving the suggestion brings the button back.
    await expect(page.getByTestId('planner-use-advice')).toBeVisible();

    const items = Number(await page.getByTestId('planner-preview').getAttribute('data-items'));
    expect(items).toBeGreaterThan(0);
    expect(items).toBeLessThan(ITEM_TYPE_IDS.length);
    await expect(page.getByTestId('plan-domain-Gv')).toBeVisible();
    await expect(page.locator('[data-testid^="plan-domain-"]')).toHaveCount(1);

    // Start hands the plan to the runner through the URL, and the runner deals exactly it.
    const href = (await page.getByTestId('planner-start').getAttribute('href'))!;
    const listed = new URL(href, page.url()).searchParams.get('types')!.split(',');
    expect(listed).toHaveLength(items);
    for (const id of listed) expect(getMeta(id as never).domain).toBe('Gv');

    await page.getByTestId('planner-start').click();
    await waitForQuiz(page);
    await expect(page.getByTestId('progress-label')).toHaveText(dict('en').quiz.progress(1, items));
    await expect(page.getByTestId('quiz')).toHaveAttribute('data-item-type', listed[0]!);
  });

  test('the suggestion can be put back with one click', async ({ page }) => {
    await page.goto('en/test/');
    await page.getByTestId('budget-20').click();
    await page.getByTestId('focus-gaps').click();
    await page.getByTestId('planner-use-advice').click();
    await expect(page.getByTestId('budget-10')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('focus-mixed')).toHaveAttribute('aria-pressed', 'true');
  });

  test('the full test disables the focus and lists every format', async ({ page }) => {
    await page.goto('en/test/');
    await page.getByTestId('budget-full').click();
    await expect(page.getByTestId('focus-mixed')).toBeDisabled();
    await expect(page.getByTestId('planner-preview')).toHaveAttribute('data-items', String(ITEM_TYPE_IDS.length));
    for (const d of DOMAIN_ORDER) await expect(page.getByTestId(`plan-domain-${d}`)).toBeVisible();
  });

  test('is translated', async ({ page }) => {
    await page.goto('fr/test/');
    const fr = dict('fr').pages.test.planner;
    await expect(page.getByText(fr.budgetLegend)).toBeVisible();
    await expect(page.getByTestId('focus-gaps')).toHaveText(fr.gaps);
    await expect(page.getByTestId('planner-start')).toHaveText(fr.start);
  });
});
