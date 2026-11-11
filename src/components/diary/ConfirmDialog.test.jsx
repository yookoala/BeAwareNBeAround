import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import ConfirmDialog from './ConfirmDialog';

// M19-008 contract: a confirmation is a native <dialog> shown with showModal()
// (Chromium puts it in the top layer with a real ::backdrop and renders the
// page behind inert), and Cancel/Delete are the only controls — there is no
// close button because the two buttons *are* the choices.
let showModalSpy;

function openDialog(overrides = {}) {
  const handlers = {
    id: 'confirmModal',
    title: 'Delete entry?',
    prompt: 'Are you sure you want to delete this entry?',
    cancelLabel: 'Cancel',
    confirmLabel: 'Delete',
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
  render(<ConfirmDialog {...handlers} />);
  return { handlers, dialog: screen.getByRole('dialog', { name: handlers.title }) };
}

afterEach(() => {
  showModalSpy?.mockRestore();
  showModalSpy = undefined;
});

test('opens modally with showModal, and Cancel/Delete are the only controls', () => {
  showModalSpy = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
  const { dialog } = openDialog();

  expect(showModalSpy).toHaveBeenCalledTimes(1);
  expect(dialog.tagName).toBe('DIALOG');
  expect(dialog.open).toBe(true);
  expect(within(dialog).getByText('Are you sure you want to delete this entry?')).toBeInTheDocument();
  expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['Cancel', 'Delete']);
  expect(within(dialog).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
});

test('focus starts on Cancel so an accidental Enter cannot delete', () => {
  const { dialog } = openDialog();
  const cancel = within(dialog).getByRole('button', { name: 'Cancel' });

  expect(cancel).toHaveFocus();
});

test('Escape closes the dialog and cancels exactly once', () => {
  const { handlers, dialog } = openDialog();

  fireEvent.keyDown(window, { key: 'Escape' });

  expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  expect(handlers.onConfirm).not.toHaveBeenCalled();
  expect(dialog.open).toBe(false);
});

test('a pointer-down on the backdrop cancels; one inside the box does not', () => {
  const { handlers, dialog } = openDialog();

  fireEvent.pointerDown(within(dialog).getByText('Are you sure you want to delete this entry?'));
  expect(handlers.onCancel).not.toHaveBeenCalled();

  // Scrim clicks: the ::backdrop is painted by the dialog element, so a
  // pointer-down that is not inside the box is a click on the dark area.
  fireEvent.pointerDown(dialog);
  expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  expect(dialog.open).toBe(false);
});

test('Cancel closes without confirming', () => {
  const { handlers, dialog } = openDialog();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

  expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  expect(handlers.onConfirm).not.toHaveBeenCalled();
  expect(dialog.open).toBe(false);
});

test('Delete closes the dialog first, confirms, and does not also cancel', () => {
  const { handlers, dialog } = openDialog();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

  // Closing before the destructive action keeps an open modal out of any
  // view-transition snapshot the page takes when it navigates away.
  expect(dialog.open).toBe(false);
  expect(handlers.onConfirm).toHaveBeenCalledTimes(1);
  expect(handlers.onCancel).not.toHaveBeenCalled();
});
