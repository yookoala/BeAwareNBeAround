import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

const SCROLL_LOCK_CLASS = 'dialog-open';

/**
 * Two-choice confirmation dialog (M19-008) shared by the delete confirm and
 * the three unsaved-changes confirms.
 *
 * A native <dialog> shown with showModal() rather than an overlay div: the
 * browser puts it in the top layer, so it paints above the sticky subheader,
 * the bottom nav and the toasts without z-index juggling, `::backdrop` is the
 * dimmed transparent scrim, and everything behind it becomes inert. Cancel and
 * the destructive action are the only controls — no close button, because the
 * two buttons are the choices.
 *
 * Escape and a pointer-down on the scrim cancel; a keydown handler drives the
 * close itself (preventDefault + close()) so there is exactly one close event
 * and the behaviour is identical in jsdom, where dialogs have no native Escape
 * handling or focus trap. The cancel button holds focus on open so the
 * destructive action is never the keyboard default.
 */
export default function ConfirmDialog({ id, title, prompt, cancelLabel, confirmLabel, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const onConfirmRef = useRef(onConfirm);
  // True once an explicit button has resolved the dialog, so the close event
  // does not run the cancel path a second time.
  const resolvedRef = useRef(false);

  // Pages pass fresh closures every render; the mount-only dialog effect below
  // reads them through refs so it never re-runs (and never re-calls showModal).
  useEffect(() => {
    onCancelRef.current = onCancel;
    onConfirmRef.current = onConfirm;
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    document.body.classList.add(SCROLL_LOCK_CLASS);
    dialog.showModal();
    cancelRef.current?.focus();

    const onClose = () => {
      if (!resolvedRef.current) onCancelRef.current();
    };
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dialog.close();
    };
    // Scrim clicks: a modal dialog's ::backdrop is painted by the dialog
    // element, so a pointer-down whose target is not inside the box (the scrim
    // itself, or whatever the engine reports for it) is a click on the dark
    // area. Capture phase, so it cannot be swallowed by the page behind.
    const onPointerDown = (event) => {
      // Node.contains() is true for the node itself, so the dialog element as
      // target is the scrim; only a descendant is a click inside the card.
      if (event.target === dialog || !dialog.contains(event.target)) dialog.close();
    };
    // Window/document-level rather than element-level: a modal dialog keeps
    // focus inside itself in Chromium, but these fallbacks have to work where
    // it does not (or where neither is implemented, as in jsdom).
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    dialog.addEventListener('close', onClose);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
      dialog.removeEventListener('close', onClose);
      document.body.classList.remove(SCROLL_LOCK_CLASS);
    };
  }, []);

  function resolveWith(onResolved) {
    const dialog = dialogRef.current;
    if (!dialog) return;
    resolvedRef.current = true;
    // Close before the action runs: an open modal would otherwise be captured
    // in the view-transition snapshot the page takes as it navigates away.
    dialog.close();
    onResolved();
  }

  return (
    <dialog
      ref={dialogRef}
      id={id}
      className="confirm-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-prompt`}
    >
      <h2 id={`${id}-title`} className="confirm-dialog-title">{title}</h2>
      <p id={`${id}-prompt`} className="confirm-dialog-prompt">{prompt}</p>
      <div className="confirm-dialog-actions">
        <button ref={cancelRef} type="button" className="confirm-cancel-btn" onClick={() => resolveWith(onCancelRef.current)}>
          {cancelLabel}
        </button>
        <button type="button" className="confirm-destructive-btn" onClick={() => resolveWith(onConfirmRef.current)}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
