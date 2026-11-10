import { t } from '@lingui/core/macro';
import { Fragment, useState } from 'react';
import MiniMonth from '../components/diary/MiniMonth';
import usePageBodyClass from '../hooks/usePageBodyClass';
import { EFHK_LOGO_URL } from '../data/mockDashboard';
import { getReportA } from '../data/mockReportA';
import ReportControls from '../components/diary/ReportControls';
import '../styles/report-a.css';

// Mirrors report-level-a.html 1:1 (M11-001): control bar + A4 landscape
// sheet; the B&W toggle adds bw-mode to the sheet like toggleMode().
export default function ReportLevelAPage() {
  usePageBodyClass('page-report-a');
  const [bw, setBw] = useState(false);
  const { footer, months, patientInfo, reportPeriod, reportTitle, stats, timeline } = getReportA();

  return (
    <>
      {/* 網頁預覽用的控制列 */}
      <ReportControls bw={bw} onToggle={() => setBw((v) => !v)} />

      {/* A4 PDF 本體 */}
      <div className={`a4-landscape${bw ? ' bw-mode' : ''}`} id="pdfContainer">
        <div className="pdf-header">
          <div className="pdf-logo-area">
            <img src={EFHK_LOGO_URL} alt="EFHK Logo" className="pdf-logo-img" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{t({ id: "report.foundation", message: "Epilepsy Foundation of Hong Kong" })}</div>
              <div style={{ fontSize: '9px', color: '#6E6E73' }}>
                Epilepsy Foundation of Hong Kong
              </div>
            </div>
          </div>
          <div className="pdf-title">
            <h1>{reportTitle}</h1>
            <p>{t({ id: "report.period", message: "Report period" })}: {reportPeriod} (YYYY-MM-DD)</p>
          </div>
        </div>

        <div className="pdf-body">
          {/* 左側 */}
          <div className="left-column">
            <div className="box">
              <div className="box-title">{t({ id: "report.basics", message: "1. Personal details and 90-day statistics" })}</div>
              <div className="patient-info-grid">
                {patientInfo.map((item) => (
                  <div key={item.label} className="info-item">
                    <span>{item.label}</span> <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
              <div className="stats-row">
                {stats.map((stat) => (
                  <div key={stat.label} className="stat-box">
                    <div className="num">{stat.num}</div>
                    <div className="label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="box" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="box-title">{t({ id: "report.heatmap", message: "2. Seizure and health heatmap" })}</div>
              <div className="multi-month-container">
                {months.map((month) => (
                  <MiniMonth key={`${month.year}-${month.month}`} {...month} />
                ))}
              </div>
              <div className="cal-legend">
                <div>
                  <span className="mark-attack" style={{ padding: '1px 5px' }}>{t({ id: "report.count", message: "#" })}</span> {t({ id: "report.seizureDay", message: "Seizure day" })}
                </div>
                <div>
                  <span
                    style={{ display: 'inline-block', width: '12px', height: '12px', border: '1px solid #CCC' }}
                    className="mark-period"
                  ></span>{' '}
                  {t({ id: "report.periodIllness", message: "Period/illness" })}
                </div>
                <div>
                  {t({ id: "report.medicationRecord", message: "Medication" })}: <span className="css-circle"></span> {t({ id: "report.taken", message: "Taken" })} / <span className="css-triangle"></span> {t({ id: "report.missed", message: "Missed" })}
                </div>
              </div>
            </div>
          </div>

          {/* 右側 */}
          <div className="right-column">
            <div className="box-title">{t({ id: "report.timeline", message: "3. Key seizures and unusual events (90 days)" })}</div>
            <div className="timeline-container">
              {timeline.map((entry) => (
                <div key={entry.header} className="timeline-date-group">
                  <div className="timeline-date-header">
                    <span>{entry.header}</span>
                    <span className="med-check">
                      {t({ id: "report.medicationRecord", message: "Medication" })}: {entry.meds.map((med, i) =>
                        med === 'circle' ? (
                          <span key={i} className="css-circle"></span>
                        ) : (
                          <span key={i} className="css-triangle"></span>
                        ),
                      )}
                      {entry.missed ? ` (${entry.missed})` : ''}
                    </span>
                  </div>
                  <div className="cluster-list">
                    {entry.clusters.map((cluster, i) => (
                      <Fragment key={cluster.time}>
                        {i > 0 ? ' ' : ''}
                        <div className={`cluster-tag type-${cluster.type}`}>
                          <span className="time">{cluster.time}</span> {cluster.text}
                        </div>
                      </Fragment>
                    ))}
                    <div style={{ fontSize: '9px', color: '#6E6E73', marginTop: '4px' }}>
                      {entry.remark}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pdf-footer">
          <span>{footer.left}</span>
          <span>{footer.right}</span>
        </div>
      </div>
    </>
  );
}
