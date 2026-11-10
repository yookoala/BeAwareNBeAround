import { useEffect, useRef } from 'react';
import { t } from '@lingui/core/macro';

export default function Modal({ id, title, onClose, children }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [onClose]);
  return (
    <div className="modal-overlay" id={id} style={{ display: 'flex' }}>
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <div className="modal-header">
          <h2 id={`${id}-title`}>{title}</h2>
          <button ref={closeRef} className="close-btn" onClick={onClose} aria-label={t({ id: 'diary.close', message: 'Close' })}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
