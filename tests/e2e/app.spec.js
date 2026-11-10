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

test('event log replaces top header, warns on unsaved changes, and returns to diary', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '日記', exact: true }).click();
  await page.locator('#btn-attack').click();
  await expect(page).toHaveURL(/\/diary\/event-log$/);
  await expect(page.locator('.app-header')).toHaveCount(0);
  await expect(page.locator('.diary-subheader')).toBeVisible();
  await expect(page.locator('.bottom-nav a[href="/diary"]')).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: '無預兆' }).click();
  await page.getByRole('button', { name: '← 返回' }).click();
  await expect(page.getByRole('dialog', { name: '尚未儲存' })).toBeVisible();
  await page.getByRole('button', { name: '繼續編輯' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('記錄已儲存！');
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: '← 返回' }).click();
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

test('medical profile works with keyboard and retains the diary shell', async ({ page }) => {
  await page.goto('/diary');
  await page.locator('.profile-card').click();
  await expect(page).toHaveURL(/\/diary\/profile$/);
  await expect(page.locator('.app-header')).toBeVisible();
  await expect(page.locator('.bottom-nav a[href="/diary"]')).toHaveAttribute('aria-current', 'page');
  const section = page.getByTestId('accordion-contacts');
  const toggle = section.locator('.accordion-header');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const phone = section.locator('.phone-input');
  await phone.focus();
  const outline = await phone.evaluate((element) => { const s = getComputedStyle(element); return [s.outlineStyle, parseFloat(s.outlineWidth)]; });
  expect(outline[0]).not.toBe('none');
  expect(outline[1]).toBeGreaterThanOrEqual(2);
  await phone.fill('+852 9876-5432');
  await expect(section.locator('.wa-link')).toHaveAttribute('href', /^https:\/\/wa\.me\/85298765432\?text=/);
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('檔案已儲存');
  await expect(page.getByRole('status')).toHaveCount(0);
  await page.getByRole('button', { name: '← 返回' }).click();
  await expect(page).toHaveURL(/\/diary$/);
});

test('complete diary journey includes both printable reports', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '日記', exact: true }).click();
  await expect(page.locator('#btn-attack')).toContainText('腦癇記錄');
  await expect(page.locator('#btn-headache')).toContainText('頭痛記錄');
  await expect(page.locator('#appMode, .first-aid-banner')).toHaveCount(0);
  await expect(page.locator('#fabRecord')).toBeVisible();
  await page.locator('.month-button').click();
  await expect(page.locator('#monthlyModal [role="dialog"]')).toBeVisible();
  await page.getByRole('button', { name: '關閉' }).click();
  await page.getByRole('button', { name: /生理及健康/ }).click();
  await expect(page.locator('#stateModal [role="dialog"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('#btn-attack').click();
  await page.getByRole('button', { name: '叢集 / 連續多次' }).click();
  await page.locator('#cluster-counter button').last().click();
  await expect(page.locator('#attack-count')).toHaveText('3');
  const noAura = page.getByRole('button', { name: '無預兆' });
  await noAura.click();
  const visual = page.getByRole('button', { name: '視覺 (如閃光/幻覺)' });
  await visual.click();
  await expect(noAura).toHaveAttribute('aria-pressed', 'false');
  await expect(visual).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '← 返回' }).click();
  await expect(page.getByRole('dialog', { name: '尚未儲存' })).toBeVisible();
  await page.getByRole('button', { name: '確定離開' }).click();
  await page.locator('.profile-card').click();
  const contacts = page.getByTestId('accordion-contacts');
  await contacts.locator('.accordion-header').click();
  await contacts.locator('.phone-input').fill('+852 9876 5432');
  await expect(contacts.locator('.wa-link')).toHaveAttribute('href', /^https:\/\/wa\.me\/85298765432\?text=/);
  await expect(contacts.locator('.call-link')).toHaveAttribute('href', 'tel:+85298765432');
  await expect(contacts.locator('.sms-link')).toHaveAttribute('href', /^sms:\+85298765432\?body=/);
  await page.getByRole('button', { name: '← 返回' }).click();
  for (const [level, sheet] of [['a', 'a4-landscape'], ['b', 'page-container']]) {
    await page.locator(`[data-report="level-${level}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/diary/report/level-${level}$`));
    await expect(page.locator('.app-header, .bottom-nav')).toHaveCount(0);
    await expect(page.locator(`#pdfContainer.${sheet}`)).toBeVisible();
    await page.getByRole('button', { name: '切換 黑白/彩色 模式' }).click();
    await expect(page.locator('#pdfContainer')).toHaveClass(/bw-mode/);
    await expect(page.locator('#modeStatus')).toContainText('黑白');
    await page.getByRole('button', { name: '← 返回日記' }).click();
    await expect(page).toHaveURL(/\/diary$/);
  }
  for (const [menu, title] of [['简体', '癫痫及头痛追踪'], ['EN', 'Epilepsy and Headache Tracking'], ['繁體', '腦癇及頭痛追蹤']]) {
    await page.locator('.lang-menu-toggle').click();
    await page.getByRole('menuitem', { name: menu, exact: true }).click();
    await expect(page.locator('.dashboard-title')).toHaveText(title);
  }
});

test('report sheets keep content above the footer and print at A4 size', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '日記', exact: true }).click();
  for (const [level, count, width, height] of [['a', 1, 841.9, 595], ['b', 3, 595, 841.9]]) {
    await page.locator(`[data-report="level-${level}"]`).click();
    const sheets = page.locator('.a4-landscape, .a4-portrait');
    await expect(sheets).toHaveCount(count);
    for (const sheet of await sheets.all()) {
      const geometry = await sheet.evaluate((el) => {
        const footer = el.querySelector('.pdf-footer').getBoundingClientRect();
        const content = el.querySelector('.right-column, .data-table');
        return { contentBottom: content.getBoundingClientRect().bottom, footerTop: footer.top };
      });
      expect(geometry.contentBottom).toBeLessThanOrEqual(geometry.footerTop);
    }
    const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
    const source = pdf.toString('latin1');
    expect((source.match(/\/Type\s*\/Page\b/g) || []).length).toBe(count);
    const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(source);
    expect(Number(box[1])).toBeCloseTo(width, 0);
    expect(Number(box[2])).toBeCloseTo(height, 0);
    await page.getByRole('button', { name: '← 返回日記' }).click();
  }
});

test('clinical report markers preserve their colors when printed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '日記', exact: true }).click();
  for (const [level, selectors] of [
    ['a', ['.a4-landscape', '.mark-attack', '.mark-period', '.css-circle', '.css-triangle', '.cluster-tag']],
    ['b', ['.a4-portrait', '.css-circle', '.css-triangle', '.cluster-tag', '.action-tag', '.month-divider']],
  ]) {
    await page.locator(`[data-report="level-${level}"]`).click();
    await page.emulateMedia({ media: 'print' });
    for (const selector of selectors) {
      const marker = page.locator(selector).first();
      await expect(marker).toHaveCount(1);
      expect(await marker.evaluate((element) => getComputedStyle(element).getPropertyValue('print-color-adjust'))).toBe('exact');
      expect(await marker.evaluate((element) => getComputedStyle(element).getPropertyValue('-webkit-print-color-adjust'))).toBe('exact');
    }
    await page.emulateMedia({ media: 'screen' });
    await page.getByRole('button', { name: '← 返回日記' }).click();
  }
});

async function openExpandedProfile(page) {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('link', { name: '日記', exact: true }).click();
  await page.locator('.profile-card').click();
  for (const id of ['basics', 'contacts', 'auras']) {
    await page.getByTestId(`accordion-${id}`).locator('.accordion-header').click();
  }
  await page.getByRole('button', { name: '+ 新增自訂預兆' }).click();
  await expect(page.locator('#custom-aura-list input')).toBeVisible();
}

test('expanded profile fits a 375px viewport', async ({ page }) => {
  await openExpandedProfile(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('expanded profile adjacent fields do not overlap', async ({ page }) => {
  await openExpandedProfile(page);
  for (const id of ['basics', 'contacts']) {
    const inputs = page.getByTestId(`accordion-${id}`).locator('.row .col .form-control');
    expect(await inputs.count()).toBe(2);
    const first = await inputs.nth(0).boundingBox();
    const second = await inputs.nth(1).boundingBox();
    expect(first.x + first.width).toBeLessThanOrEqual(second.x);
  }
});

test('event log fields stay inside their form sections on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('link', { name: '日記', exact: true }).click();
  await page.locator('#btn-attack').click();
  for (const selector of ['.datetime-picker', '.textarea-box']) {
    const control = page.locator(selector);
    const bounds = await control.boundingBox();
    const section = await control.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " form-section ")]').boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(section.x);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(section.x + section.width);
  }
});
