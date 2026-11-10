import { NavLink } from 'react-router-dom';
import { t } from '@lingui/core/macro';

// Fixed bottom tab bar (PLAN06 M13-003): the top-level modes.
// 指南 (first-aid medical cross) -> /, 日記 (notebook) -> /diary, 資源 (help question mark) -> /resource.
// NavLink provides aria-current="page" on the active tab.
export function BottomNav({ hidden = false }) {
  return (
    <nav className={`bottom-nav${hidden ? ' is-hidden' : ''}`} aria-label={t({ id: 'nav.ariaLabel', message: 'First Aid and Diary' })}>
      <NavLink to="/" end className="bottom-nav-tab">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 4v16" /><path d="M4 12h16" /></svg>
        <span>{t({ id: 'nav.firstAid', message: 'First Aid' })}</span>
      </NavLink>
      <NavLink to="/diary" className="bottom-nav-tab">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6h4" /><path d="M2 10h4" /><path d="M2 14h4" /><path d="M2 18h4" /><rect width="16" height="20" x="4" y="2" rx="2" /><path d="M16 2v20" /></svg>
        <span>{t({ id: 'nav.diary', message: 'Diary' })}</span>
      </NavLink>
      <NavLink to="/resource" className="bottom-nav-tab">
        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
        <span>{t({ id: 'nav.resource', message: 'Resource' })}</span>
      </NavLink>
    </nav>
  );
}
