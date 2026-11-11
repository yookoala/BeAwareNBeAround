import { expect, test } from '@playwright/test';
import { journeySeedEntries, seedDiaryEntries } from './diary-db.js';

// Full M19 journey against real Chromium IndexedDB: create → dashboard card
// → full list → detail → edit (pre-filled) → save-in-place (no duplicate) →
// delete with confirmation → gone after reload. zh-HK is the default locale.
// A health entry is the subject because its custom item text is visible in
// card summaries, which makes the no-duplicate check observable in the list.
const marker = 'journey marker';
const editedMarker = 'journey marker edited';

test('diary entries journey creates, reviews, edits, and deletes a stored entry', async ({ page }) => {
  // Fresh Playwright context: IndexedDB starts empty; seeding writes through
  // the app's own store/schema, so the run is hermetic and order-independent.
  await page.goto('/');
  await seedDiaryEntries(page, journeySeedEntries);

  await page.getByRole('link', { name: '日記', exact: true }).click();
  await expect(page.locator('.recent-entries-list .recent-entry-card')).toHaveCount(5);

  // 1. Create via FAB → event menu → health form.
  await page.locator('#fabRecord').click();
  await page.locator('#btn-health').click();
  await page.getByRole('button', { name: '女性生理期' }).click();
  await page.getByRole('button', { name: '+ 新增自訂狀況' }).click();
  await page.getByLabel('輸入自訂狀況...').fill(marker);
  await page.getByLabel('健康狀況備註').fill('journey notes');
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('記錄已儲存！');
  await page.getByRole('button', { name: '← 返回' }).click();
  await expect(page).toHaveURL(/\/diary\/event$/);
  await page.getByRole('button', { name: '← 返回' }).click();
  await expect(page).toHaveURL(/\/diary$/);

  // 2. The dashboard shows five cards (capped) with the new entry first: its
  //    record time is "now", newer than the pinned 2026-09 seeds.
  const cards = page.locator('.recent-entries-list .recent-entry-card');
  await expect(cards).toHaveCount(5);
  await expect(cards.first()).toContainText(marker);
  await cards.first().click();
  await expect(page).toHaveURL(/\/diary\/entry\/[0-9a-f-]{36}$/);
  const entryPath = new URL(page.url()).pathname;

  // 3. Detail view renders the recorded values read-only.
  await expect(page.getByText('記錄時間')).toBeVisible();
  await expect(page.getByText('女性生理期')).toBeVisible();
  await expect(page.getByText(marker)).toBeVisible();
  await expect(page.getByText('journey notes')).toBeVisible();

  // 4. Edit reopens the health form pre-filled.
  await page.getByRole('button', { name: '編輯' }).click();
  await expect(page).toHaveURL(new RegExp(`/diary/event/health\\?edit=${entryPath.split('/').pop()}$`));
  await expect(page.getByRole('button', { name: '女性生理期' })).toHaveAttribute('aria-pressed', 'true');
  // The seeded custom item is the only custom input on the form.
  await expect(page.getByLabel('輸入自訂狀況...')).toHaveValue(marker);
  await expect(page.getByLabel('健康狀況備註')).toHaveValue('journey notes');

  // 5. Saving the edit updates the same entry and lands back on the detail.
  await page.getByLabel('輸入自訂狀況...').fill(editedMarker);
  await page.getByRole('button', { name: '儲存', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${entryPath}$`));
  await expect(page.getByRole('status')).toHaveText('記錄已儲存！');
  await expect(page.getByText(editedMarker)).toBeVisible();

  // 6. Full list carries every entry exactly once (5 seeds + 1 created).
  await page.getByRole('link', { name: '日記', exact: true }).click();
  await page.locator('.see-all-btn').click();
  await expect(page).toHaveURL(/\/diary\/entries$/);
  await expect(page.locator('.recent-entry-card')).toHaveCount(6);
  await expect(page.getByText(editedMarker)).toHaveCount(1);

  // 7. Delete: Cancel keeps the entry; confirming removes it and lands back
  //    on the list with the delete toast.
  await page.locator('.recent-entry-card').first().click();
  await expect(page).toHaveURL(new RegExp(`${entryPath}$`));
  await page.getByRole('button', { name: '刪除記錄' }).click();
  await expect(page.getByRole('dialog', { name: '刪除記錄？' })).toBeVisible();
  await page.getByRole('button', { name: '取消' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '刪除記錄' }).click();
  await page.getByRole('button', { name: '刪除', exact: true }).click();
  await expect(page).toHaveURL(/\/diary\/entries$/);
  await expect(page.getByRole('status')).toHaveText('記錄已刪除');
  await expect(page.locator('.recent-entry-card')).toHaveCount(5);
  await expect(page.getByText(editedMarker)).toHaveCount(0);

  // 8. The deletion is persisted: a reload (static /diary/entries page)
  //    still shows the shrunken store.
  await page.reload();
  await expect(page.locator('.recent-entry-card')).toHaveCount(5);
  await expect(page.getByText(editedMarker)).toHaveCount(0);
});
