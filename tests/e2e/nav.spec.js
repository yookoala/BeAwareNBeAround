import { expect, test } from '@playwright/test';
import { mockCounterRoute } from './mock-counter.js';

test('switches between first-aid and the diary dashboard via the bottom bar', async ({ page }) => {
  mockCounterRoute(page, { initialTotal: 12544 });
  await page.goto('/');

  const diaryTab = page.getByRole('link', { name: '日記' });
  await expect(diaryTab).toBeVisible();
  await diaryTab.click();
  await expect(page.getByRole('heading', { name: '腦癇及頭痛追蹤' })).toBeVisible();
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

  await expect(page.getByRole('heading', { name: '腦癇及頭痛追蹤' })).toBeVisible();
  await expect(page.getByRole('button', { name: '語言' })).toBeVisible();
  await expect(page.getByRole('link', { name: '日記' })).toHaveAttribute('aria-current', 'page');
});

test('auto-hides header and bottom bar on downward scroll and reveals them after scrolling up at least 5vh', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 600 });
  mockCounterRoute(page, { initialTotal: 12544 });
  await page.goto('/');

  const header = page.locator('.app-header');
  const bottomNav = page.locator('.bottom-nav');
  await expect(header).not.toHaveClass(/is-hidden/);
  await expect(bottomNav).not.toHaveClass(/is-hidden/);

  // Scroll down 200px: both bars retract.
  await page.evaluate(() => window.scrollTo(0, 200));
  await expect(header).toHaveClass(/is-hidden/);
  await expect(bottomNav).toHaveClass(/is-hidden/);

  // Scroll up by 15px (< 5vh = 30px at 600px height): still hidden.
  await page.evaluate(() => window.scrollTo(0, 185));
  await expect(header).toHaveClass(/is-hidden/);
  await expect(bottomNav).toHaveClass(/is-hidden/);

  // Scroll up to 165px (total 35px >= 5vh = 30px): both bars reappear.
  await page.evaluate(() => window.scrollTo(0, 165));
  await expect(header).not.toHaveClass(/is-hidden/);
  await expect(bottomNav).not.toHaveClass(/is-hidden/);
});

test('dashboard keeps its FAB above navigation and scrolls the window', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 600 });
  mockCounterRoute(page, { initialTotal: 12544 });
  await page.goto('/diary');
  const fab = page.locator('#fabRecord');
  const nav = page.locator('.bottom-nav');
  const fabBox = await fab.boundingBox();
  const navBox = await nav.boundingBox();
  expect(fabBox.y + fabBox.height).toBeLessThan(navBox.y);
  expect(await page.locator('.app-container').evaluate((el) => getComputedStyle(el).textAlign)).toBe('left');
  await page.evaluate(() => window.scrollTo(0, 200));
  await expect(page.locator('.app-header')).toHaveClass(/is-hidden/);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole('button', { name: /完整月曆/ }).click();
  await expect(page.getByRole('dialog', { name: '2026年 9月 記錄' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('dashboard and monthly calendar fit a 320px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 600 });
  mockCounterRoute(page, { initialTotal: 12544 });
  await page.goto('/diary');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const calendar = page.locator('#cal-past-7');
  const lastDay = calendar.locator('.calendar-day').last();
  expect((await lastDay.boundingBox()).x + (await lastDay.boundingBox()).width).toBeLessThanOrEqual((await calendar.boundingBox()).x + (await calendar.boundingBox()).width);
  await page.getByRole('button', { name: /完整月曆/ }).click();
  const dialog = await page.getByRole('dialog').boundingBox();
  expect(dialog.x).toBeGreaterThanOrEqual(0);
  expect(dialog.x + dialog.width).toBeLessThanOrEqual(320);
});
