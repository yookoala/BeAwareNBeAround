import { expect, test } from '@playwright/test';
import { mockPlaylistPlayer } from './mock-playlist-player.js';

const languageStates = [
  {
    selector: '繁體',
    brandTitle: '腦癎錦囊',
    action: '守',
    panelHeading: '如何安裝至手機',
    loadingStatus: '載入中…',
    educationStatus: '播放教育步驟 1...',
    closeButtonName: '關閉',
  },
  {
    selector: '简体',
    brandTitle: '脑痫锦囊',
    action: '守',
    panelHeading: '如何安装至手机',
    loadingStatus: '加载中…',
    educationStatus: '播放教育步骤 1...',
    closeButtonName: '关闭',
  },
  {
    selector: 'EN',
    brandTitle: 'EFHK Seizure Help',
    action: 'STAY',
    panelHeading: 'How to Install',
    loadingStatus: 'Loading…',
    educationStatus: 'Playing education step 1...',
    closeButtonName: 'Close',
  },
];

for (const language of languageStates) {
  test(`renders localized education content and status for ${language.selector}`, async ({ page }) => {
    // The deterministic media stand-in keeps the phase assertions reproducible:
    // the playing status arrives when the test reports the media event, not
    // when a fixture recording happens to decode.
    const media = await mockPlaylistPlayer(page);
    await page.goto('/');

    await page.getByRole('button', { name: '語言' }).click();
    await page.getByRole('menuitem', { name: language.selector, exact: true }).click();
    await expect(page.locator('.app-header .app-header-title')).toHaveText(language.brandTitle);
    await expect(page.locator('.app-header .app-header-home-link')).toHaveAttribute('href', './');
    const headerFitsSingleRow = await page.evaluate(() => {
      const header = document.querySelector('.app-header');
      const logo = document.querySelector('.app-header-logo');
      const title = document.querySelector('.app-header-title');
      const toggle = document.querySelector('.lang-menu-toggle');
      const headerRect = header.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const toggleRect = toggle.getBoundingClientRect();
      return (
        document.documentElement.scrollWidth <= window.innerWidth
        && Math.abs((logoRect.top + logoRect.height / 2) - (toggleRect.top + toggleRect.height / 2)) <= 6
        && titleRect.right <= toggleRect.left
        && headerRect.top === 0
      );
    });
    expect(headerFitsSingleRow).toBe(true);
    await page.locator('.setup-guide').click();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: language.panelHeading })).toBeVisible();
    await page.getByRole('button', { name: language.closeButtonName }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await page.getByRole('button', { name: language.action, exact: true }).click();
    await expect(page.locator('.status')).toHaveText(language.loadingStatus);
    await media.fire('playing');
    await expect(page.locator('.status')).toHaveText(language.educationStatus);
  });
}

test('closes the setup dialog on Escape', async ({ page }) => {
  await page.goto('/');

  await page.locator('.setup-guide').click();
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('includes generated PWA assets', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', /manifest/);
  await expect(page.getByRole('heading', { name: "Be Aware n' Be Around" })).toBeVisible();
});

test('event log keeps shell, selections across languages and returns to diary', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '日記', exact: true }).click();
  await page.locator('#btn-attack').click();
  await expect(page).toHaveURL(/\/diary\/event-log$/);
  await expect(page.locator('.app-header')).toBeVisible();
  await expect(page.locator('.bottom-nav a[href="/diary"]')).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: '無預兆' }).click();
  await page.getByRole('button', { name: '語言' }).click();
  await page.getByRole('menuitem', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('button', { name: 'No Aura' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Entry saved!');
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: '← Cancel' }).click();
  await expect(page).toHaveURL(/\/diary$/);
});

test('event log text controls have a visible keyboard focus ring', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '日記', exact: true }).click();
  await page.locator('#btn-attack').click();

  for (const id of ['event-time', 'event-notes']) {
    for (let i = 0; i < 80 && await page.evaluate(() => document.activeElement?.id) !== id; i++) {
      await page.keyboard.press('Tab');
    }
    const control = page.locator(`#${id}`);
    await expect(control).toBeFocused();
    const outline = await control.evaluate((element) => {
      const style = getComputedStyle(element);
      return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThanOrEqual(2);
  }
});
