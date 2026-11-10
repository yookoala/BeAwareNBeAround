import { Fragment, useState } from 'react';
import A4Page from '../components/diary/A4Page';
import ActionTag from '../components/diary/ActionTag';
import DataTable from '../components/diary/DataTable';
import MonthDividerRow from '../components/diary/MonthDividerRow';
import ProfileItem from '../components/diary/ProfileItem';
import usePageBodyClass from '../hooks/usePageBodyClass';
import { getReportB } from '../data/mockReportB';
import ReportControls from '../components/diary/ReportControls';
import '../styles/report-b.css';

// Mirrors report-level-b.html 1:1 (M11-002): 3 stacked A4 portrait pages;
// the B&W toggle adds bw-mode to the whole page-container like toggleMode().

// { text, bold?, color? } cell.
function TextCell({ cell }) {
  if (cell.bold) {
    return (
      <strong style={cell.color ? { color: cell.color } : undefined}>{cell.text}</strong>
    );
  }
  return cell.text;
}

// 劑量與頻率 cell: text (optionally bold) + optional action tag, with the
// prototype's space before the tag.
function DoseCell({ cell }) {
  return (
    <>
      {cell.bold ? <strong>{cell.text}</strong> : cell.text}
      {cell.tag ? (
        <>
          {' '}
          <ActionTag tag={cell.tag} />
        </>
      ) : (
        ''
      )}
    </>
  );
}

// 服藥 cell: circle/triangle marks joined by a space (whitespace matters in
// normal table-cell flow).
function MedMarks({ marks }) {
  return marks.map((mark, i) => (
    <Fragment key={i}>
      {i > 0 ? ' ' : ''}
      {mark === 'circle' ? (
        <span className="css-circle"></span>
      ) : (
        <span className="css-triangle"></span>
      )}
    </Fragment>
  ));
}

// 時間 cell: times joined by <br> (no spaces, like the prototype).
function TimeCell({ times }) {
  return times.map((time, i) => (
    <Fragment key={i}>
      {i > 0 ? <br /> : ''}
      {time}
    </Fragment>
  ));
}

// 發作事件與長度 cell: cluster tags with " (duration)" text, events
// separated by <br> (the prototype's inter-event whitespace collapses at
// line start, so a plain <br> matches).
function EventCell({ row }) {
  if (!row.events) return row.eventsText;
  return row.events.map((event, i) => (
    <Fragment key={i}>
      {i > 0 ? (
        <>
          <br />
          {' '}
        </>
      ) : (
        ''
      )}
      <div className={`cluster-tag type-${event.type}`}>{event.label}</div>
      {` (${event.duration})`}
    </Fragment>
  ));
}

// 備註 cell: string or {bold}/{text} segments (segment texts carry the
// prototype's exact spacing).
function RemarkCell({ remark }) {
  const segments = typeof remark === 'string' ? [{ text: remark }] : remark;
  return segments.map((segment, i) =>
    segment.bold ? <strong key={i}>{segment.bold}</strong> : <Fragment key={i}>{segment.text}</Fragment>,
  );
}

export default function ReportLevelBPage() {
  usePageBodyClass('page-report-b');
  const [bw, setBw] = useState(false);
  const { closingNote, diagnosisItems, investigationItems, ledgerColumns, ledgerMonthsHistory, ledgerMonthsRecent, medColumns, medRows, pages, profileItems, sectionTitles } = getReportB();

  return (
    <>
      <ReportControls bw={bw} onToggle={() => setBw((v) => !v)} />

      <div className={`page-container${bw ? ' bw-mode' : ''}`} id="pdfContainer">
        {/* ================= PAGE 1 ================= */}
        <A4Page header={pages[0].header} footer={pages[0].footer}>
          <div className="section-title">{sectionTitles.profile}</div>
          <div className="profile-grid">
            {profileItems.map((item) => (
              <ProfileItem key={item.label} item={item} />
            ))}
          </div>

          <div className="section-title">{sectionTitles.diagnosis}</div>
          <div className="profile-grid">
            {diagnosisItems.map((item) => (
              <ProfileItem key={item.label} item={item} />
            ))}
          </div>

          <div className="section-title">{sectionTitles.investigations}</div>
          <div className="investigation-grid">
            {investigationItems.map((item) => (
              <ProfileItem key={item.label} item={item} />
            ))}
          </div>

          <div className="section-title">{sectionTitles.medications}</div>
          <DataTable columns={medColumns}>
            {medRows.map((row) => (
              <tr key={`${row.start.text}-${row.name.text}-${row.dose.text}`} className={row.status}>
                <td>
                  <TextCell cell={row.start} />
                </td>
                <td>
                  <TextCell cell={row.end} />
                </td>
                <td>
                  <TextCell cell={row.name} />
                </td>
                <td>
                  <DoseCell cell={row.dose} />
                </td>
                <td>{row.why}</td>
                <td>{row.results}</td>
              </tr>
            ))}
          </DataTable>
        </A4Page>

        {/* ================= PAGE 2 ================= */}
        <A4Page header={pages[1].header} footer={pages[1].footer}>
          <div className="section-title">{sectionTitles.ledgerRecent}</div>
          <LedgerTable months={ledgerMonthsRecent} columns={ledgerColumns} />
        </A4Page>

        {/* ================= PAGE 3 ================= */}
        <A4Page header={pages[2].header} footer={pages[2].footer}>
          <div className="section-title">{sectionTitles.ledgerHistory}</div>
          <LedgerTable months={ledgerMonthsHistory} columns={ledgerColumns} />

          <div
            style={{ fontSize: '10px', color: '#6E6E73', marginTop: '30px', textAlign: 'center' }}
          >
            {closingNote}
          </div>
        </A4Page>
      </div>
    </>
  );
}

// One daily-ledger table with month-divider rows.
function LedgerTable({ months, columns }) {
  return (
    <DataTable columns={columns}>
      {months.map((month) => (
        <Fragment key={month.divider}>
          <MonthDividerRow label={month.divider} colSpan={columns.length} />
          {month.rows.map((row) => (
            <tr key={row.date}>
              <td>{row.date}</td>
              <td>
                <TimeCell times={row.times} />
              </td>
              <td>
                <EventCell row={row} />
              </td>
              <td>
                <MedMarks marks={row.meds} />
              </td>
              <td>
                <RemarkCell remark={row.remark} />
              </td>
            </tr>
          ))}
        </Fragment>
      ))}
    </DataTable>
  );
}
