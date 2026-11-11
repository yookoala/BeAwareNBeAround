import { expect } from '@playwright/test';

/**
 * Asserts the M19-008 confirmation shell in a real browser — the checks jsdom
 * cannot make. A modal <dialog> (Chromium's :modal state, i.e. top layer with
 * the page behind rendered inert), a dimmed transparent scrim, a drop-shadowed
 * card, and the two choices as its only controls with the cancel action
 * focused.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ title: string, cancelLabel: string, confirmLabel: string }} labels
 */
export async function expectConfirmShell(page, { title, cancelLabel, confirmLabel }) {
  const dialog = page.getByRole('dialog', { name: title });
  await expect(dialog).toBeVisible();

  const shell = await dialog.evaluate((element) => {
    const style = getComputedStyle(element);
    const backdrop = getComputedStyle(element, '::backdrop');
    const buttons = [...element.querySelectorAll('button')];
    return {
      modal: element.matches(':modal'),
      open: element.open,
      scrim: backdrop.backgroundColor,
      scrimFilter: backdrop.backdropFilter,
      shadow: style.boxShadow,
      buttons: buttons.map((button) => button.textContent.trim()),
      labelledControls: buttons.filter((button) => button.getAttribute('aria-label')).length,
      focused: document.activeElement?.textContent?.trim(),
      scrollLocked: document.body.classList.contains('dialog-open'),
    };
  });

  expect(shell.modal).toBe(true);
  expect(shell.open).toBe(true);
  expect(shell.scrim).toBe('rgba(0, 0, 0, 0.45)');
  expect(shell.scrimFilter).toBe('blur(2px)');
  expect(shell.shadow).toMatch(/rgba\(0, 0, 0, 0\.25\) 0px 10px 30px/);
  expect(shell.buttons).toEqual([cancelLabel, confirmLabel]);
  expect(shell.labelledControls).toBe(0);
  expect(shell.focused).toBe(cancelLabel);
  expect(shell.scrollLocked).toBe(true);
}
