import { expect, test } from '@playwright/test';

// The grid is a static-width anchor (255px) that the button size, gap, and
// font are derived from. These tests pin the shipped geometry (255/100/15/32)
// and assert the derivation: overriding the grid width scales everything.

test.describe('button grid geometry', () => {
  test('preserves the current size and spacing at the static width', async ({ page }) => {
    await page.goto('/');

    // The buttons transition `all` for 0.1s on mount and the gap is a
    // percentage of the grid content, so measuring mid-transition yields a
    // too-large gap (flake seen under parallel load). Poll the grid box
    // until both dimensions report the final value before measuring — the
    // width alone can settle while the rows are still growing vertically.
    await expect
      .poll(async () => {
        const box = await page.locator('.grid').boundingBox();
        return Math.abs(box.width - 255) < 0.05 && Math.abs(box.height - 255) < 0.05;
      }, { timeout: 5000 })
      .toBe(true);

    // Snapshot every rect in one page.evaluate: separate boundingBox() calls
    // straddle frames, and a scroll-anchoring nudge after the hero image
    // settles shifted a later y-measure by ~1px (the remaining flake).
    const boxes = await page.evaluate(() => {
      const rect = (element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        grid: rect(document.querySelector('.grid')),
        buttons: Array.from(document.querySelectorAll('.btn-toy'), rect),
      };
    });

    expect(boxes.grid.width).toBeCloseTo(255, 1);
    expect(boxes.grid.height).toBeCloseTo(255, 1);

    expect(boxes.buttons).toHaveLength(4);
    for (const box of boxes.buttons) {
      expect(box.width).toBeCloseTo(100, 1);
      expect(box.height).toBeCloseTo(100, 1);
    }

    // Used gaps, derived from positions (the computed `gap` value changes
    // representation when the CSS changes from px to %).
    const [stay, safe, side] = boxes.buttons;
    expect(safe.x - stay.x - stay.width).toBeCloseTo(15, 1);
    expect(side.y - stay.y - stay.height).toBeCloseTo(15, 1);

    const fontSize = await page.evaluate(() => getComputedStyle(document.querySelector('.btn-toy')).fontSize);
    expect(parseFloat(fontSize)).toBeCloseTo(32, 1);
  });

  test('scales the buttons, gaps, and font relative to the grid width', async ({ page }) => {
    await page.goto('/');

    // The width override must not be animated: the buttons transition
    // `all` for 0.1s, which would race the measurement.
    await page.evaluate(() => {
      document.querySelectorAll('.btn-toy').forEach((button) => { button.style.transition = 'none'; });
      document.querySelector('.grid').style.width = '300px';
    });

    const grid = await page.locator('.grid').boundingBox();
    expect(grid.width).toBeCloseTo(300, 1);

    // 300px - 40px padding = 260px content; gap 15/215 of content = 18.14px;
    // each 1fr cell = (260 - 18.14) / 2 = 120.94px; font 32/215 of content.
    const stay = await page.locator('.btn-toy').first().boundingBox();
    expect(stay.width).toBeCloseTo(120.94, 1);
    expect(stay.height).toBeCloseTo(120.94, 1);

    const safe = await page.locator('.btn-toy').nth(1).boundingBox();
    expect(safe.x - stay.x - stay.width).toBeCloseTo(18.14, 1);

    const fontSize = await page.evaluate(() => getComputedStyle(document.querySelector('.btn-toy')).fontSize);
    expect(parseFloat(fontSize)).toBeCloseTo(38.7, 1);
  });
});
