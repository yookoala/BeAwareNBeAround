import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { mockCounterRoute } from '../e2e/mock-counter.js';
import { journeySeedEntries, seedDiaryEntries } from '../e2e/diary-db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Pattern route (must track EFHK_LOGO_URL in src/data/mockDashboard.js):
// keeps serving the fixture even if the logo asset name changes.
const LOGO_URL = 'https://epilepsy.org.hk/wp-content/uploads/elementor/thumbs/EFHK-abb-Logo*';
const logoBody = fs.readFileSync(path.join(__dirname, 'fixtures', 'efhk-logo.png'));

// PLAN12/M19-007 diary baselines: the four diary data views (dashboard,
// empty dashboard, full entries list, entry detail) at 375px in all three
// locales. No external network state: counter mocked, logo from fixture.
// Every captured view is clock-independent — the calendar fixture is frozen
// to the prototype's 2026-09-14 "today" and the entry rows are pinned seeds
// written into the app's own IndexedDB store before the dashboard mounts.
function mockExternalRequests(page) {
  mockCounterRoute(page, { initialTotal: 12544 });
  page.route(LOGO_URL, (route) => {
    route.fulfill({ status: 200, contentType: 'image/png', body: logoBody });
  });
}

const diaryLanguages = [
  { menu: '繁體', prefix: 'zh-hk' },
  { menu: '简体', prefix: 'zh-cn' },
  { menu: 'EN', prefix: 'en' },
];

const captureOptions = {
  fullPage: true,
  animations: 'disabled',
  maxDiffPixelRatio: 0.01,
};

// Delete-trigger and confirmation-title strings per locale, so the dialog can
// be opened in each language's own UI.
const deleteLabels = {
  'zh-hk': { trigger: '刪除記錄', title: '刪除記錄？' },
  'zh-cn': { trigger: '删除记录', title: '删除记录？' },
  en: { trigger: 'Delete entry', title: 'Delete entry?' },
};

async function openDiary(page, menu, { seed }) {
  mockExternalRequests(page);
  // Without startViewTransition, navigateWithViewTransition takes its plain
  // navigate fallback: screenshots can never catch a transition crossfade
  // (the VT snapshot fade is a compositor effect that animations: 'disabled'
  // does not stop). The captured end states are identical.
  await page.addInitScript(() => {
    delete Document.prototype.startViewTransition;
  });
  await page.goto('/');
  await page.locator('.lang-menu-toggle').click();
  await page.getByRole('menuitem', { name: menu, exact: true }).click();
  if (seed) {
    // Seed before the dashboard mounts so its first IndexedDB query sees the
    // pinned rows; the href-based nav link is locale-independent.
    await seedDiaryEntries(page, journeySeedEntries);
  }
  await page.locator('.bottom-nav a[href="/diary"]').click();
  await expect(page).toHaveURL(/\/diary$/);
}

test.describe('diary view baselines', () => {
  test.use({ viewport: { width: 375, height: 1200 } });
  test.use({ locale: 'en-US' });

  for (const language of diaryLanguages) {
    test(`preserves the seeded diary views in ${language.menu}`, async ({ page }) => {
      await openDiary(page, language.menu, { seed: true });
      await expect(page.locator('.recent-entries-list .recent-entry-card')).toHaveCount(5);
      await expect(page).toHaveScreenshot(`diary-${language.prefix}-375.png`, captureOptions);

      await page.locator('.see-all-btn').click();
      await expect(page).toHaveURL(/\/diary\/entries$/);
      await expect(page.locator('.recent-entry-card')).toHaveCount(5);
      await expect(page).toHaveScreenshot(`diary-entries-${language.prefix}-375.png`, captureOptions);

      // Fifth card is seed-5, the cluster seizure: its detail exercises the
      // severity/pattern chips with the ×3 cluster marker.
      await page.locator('.recent-entry-card').nth(4).click();
      await expect(page).toHaveURL(/\/diary\/entry\/seed-5$/);
      await expect(page).toHaveScreenshot(`diary-detail-${language.prefix}-375.png`, captureOptions);

      // The delete confirmation (M19-008): a modal <dialog> over the detail
      // view, scrim + shadowed card + the two choices.
      await page.getByRole('button', { name: deleteLabels[language.prefix].trigger }).click();
      await expect(page.getByRole('dialog', { name: deleteLabels[language.prefix].title })).toBeVisible();
      await expect(page).toHaveScreenshot(`diary-delete-confirm-${language.prefix}-375.png`, captureOptions);
    });

    test(`preserves the empty diary dashboard in ${language.menu}`, async ({ page }) => {
      await openDiary(page, language.menu, { seed: false });
      await expect(page.locator('.recent-empty')).toBeVisible();
      await expect(page).toHaveScreenshot(`diary-empty-${language.prefix}-375.png`, captureOptions);
    });
  }

  // One capture of the unsaved-changes confirmation is enough: it is the same
  // ConfirmDialog component and stylesheet as the delete confirm, only the
  // labels differ, and the other three locales differ from 繁體 by text alone.
  test('preserves the unsaved-changes confirmation on an event form', async ({ page }) => {
    await openDiary(page, '繁體', { seed: true });
    await page.locator('#fabRecord').click();
    await page.locator('#btn-health').click();
    // The form defaults its time to the current wall clock (localNowValue), so
    // the baseline would rot daily without pinning the field to a fixed value.
    await page.fill('#event-time', '2026-09-14T15:30');
    await page.getByLabel('健康狀況備註').fill('第一天經痛');
    await page.getByRole('button', { name: '← 返回' }).click();
    await expect(page.getByRole('dialog', { name: '尚未儲存' })).toBeVisible();
    await expect(page).toHaveScreenshot('diary-leave-confirm-zh-hk-375.png', captureOptions);
  });
});
