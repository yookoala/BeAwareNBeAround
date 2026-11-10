import { useEffect, useRef } from 'react';
import { t } from '@lingui/core/macro';

export default function Modal({ id, title, onClose, children }) {
  const closeRef = useRef(null);
  const contentRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const content = contentRef.current;
    closeRef.current?.focus();
    const onKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'Tab') {
        const focusable = [...content.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
          .filter((element) => !element.closest('[hidden], [inert]') && getComputedStyle(element).visibility !== 'hidden' && getComputedStyle(element).display !== 'none');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first) {
          event.preventDefault();
          content.focus();
        } else if (!content.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [onClose]);
  return (
    <div className="modal-overlay" id={id} style={{ display: 'flex' }}>
      <div ref={contentRef} className="modal-content" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1}>
        <div className="modal-header">
          <h2 id={`${id}-title`}>{title}</h2>
          <button ref={closeRef} className="close-btn" onClick={onClose} aria-label={t({ id: 'diary.close', message: 'Close' })}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
