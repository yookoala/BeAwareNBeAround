import { expect, test } from '@playwright/test';
import { mockCounterRoute } from './mock-counter.js';

test('switches between first-aid and the diary placeholder via the bottom bar', async ({ page }) => {
  mockCounterRoute(page, { initialTotal: 12544 });
  await page.goto('/');

  const diaryTab = page.getByRole('link', { name: '日記' });
  await expect(diaryTab).toBeVisible();
  await diaryTab.click();
  await expect(page.getByRole('heading', { name: '日記功能即將推出' })).toBeVisible();
  await expect(diaryTab).toHaveAttribute('aria-current', 'page');

  await page.getByRole('link', { name: '指南' }).click();
  await expect(page.getByRole('heading', { name: "Be Aware n' Be Around" })).toBeVisible();
  await expect(page.getByRole('link', { name: '指南' })).toHaveAttribute('aria-current', 'page');
});

test('keeps first-aid content clear of the fixed bottom bar', async ({ page }) => {
  mockCounterRoute(page, { initialTotal: 12544 });
  await page.goto('/');

  const bar = page.locator('.bottom-nav');
  await expect(bar).toBeVisible();
  const barBox = await bar.boundingBox();
  // The footer must sit fully above the fixed bar at the scroll bottom.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const footerAfter = await page.locator('.footer-linktree').boundingBox();
  expect(footerAfter.y + footerAfter.height).toBeLessThan(barBox.y + 1);
});

test('loads the diary route directly with the shared shell', async ({ page }) => {
  mockCounterRoute(page, { initialTotal: 12544 });
  await page.goto('/diary');

  await expect(page.getByRole('heading', { name: '日記功能即將推出' })).toBeVisible();
  await expect(page.getByRole('button', { name: '語言' })).toBeVisible();
  await expect(page.getByRole('link', { name: '日記' })).toHaveAttribute('aria-current', 'page');
});
