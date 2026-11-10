import { t } from '@lingui/core/macro';
import { EFHK_LOGO_URL } from '../../data/mockDashboard';

// A4 portrait sheet mirroring report-level-b.html's .a4-portrait: pdf-header
// (page 1 has the logo + h1; continuation pages a single styled line),
// content, and the pinned pdf-footer.
export default function A4Page({ header, footer, children }) {
  return (
    <div className="a4-portrait">
      <div className="pdf-header">
        <div className="pdf-logo-area">
          {header.logo ? (
            <>
              <img src={EFHK_LOGO_URL} alt={t({ id: 'organization.logoAlt', message: 'Epilepsy Foundation of Hong Kong' })} className="pdf-logo-img" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{t({ id: "report.foundation", message: "Epilepsy Foundation of Hong Kong" })}</div>
                <div style={{ fontSize: '9px', color: '#6E6E73' }}>
                  Epilepsy Foundation of Hong Kong
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F57C00' }}>
              {header.continuation}
            </div>
          )}
        </div>
        <div className="pdf-title">
          {header.title ? <h1>{header.title}</h1> : ''}
          <p>{header.meta}</p>
        </div>
      </div>

      {children}

      <div className="pdf-footer">
        <span>{footer.left}</span>
        <span>{footer.right}</span>
      </div>
    </div>
  );
}
