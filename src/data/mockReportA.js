import { t } from '@lingui/core/macro';

export function getReportA() {
// Mock content for the Level A report, values identical to
// efhk-diary-prototype/report-level-a.html (frozen sample period
// 2026-07-01 to 2026-09-30, PLAN05 no-clock rule).

const reportTitle = t({ id: "report.fixture.97531e9c67", message: "Long-term outpatient report (Level A - Quarterly overview)" });
const reportPeriod = t({ id: "report.fixture.d55dc98c23", message: "2026-07-01 to 2026-09-30" });

const patientInfo = [
  { label: t({ id: "report.fixture.cc8b6b96d2", message: "Name:" }), value: 'Fong *** (P-2026-08)' },
  { label: t({ id: "report.fixture.b51968341e", message: "Sex / Age:" }), value: t({ id: "report.fixture.af4d7b397c", message: "Male / 45 years" }) },
  { label: t({ id: "report.fixture.495c15a267", message: "Diagnosis:" }), value: t({ id: "report.fixture.2fe99ce129", message: "Focal Epilepsy" }) },
  { label: t({ id: "report.fixture.798c9df83c", message: "Main medication:" }), value: 'Levetiracetam 1000mg BID' },
];

const stats = [
  { num: t({ id: "report.fixture.04b7aad965", message: "3 seizures" }), label: t({ id: "report.fixture.b764971415", message: "Total seizures in 90 days" }) },
  { num: '98.5%', label: t({ id: "report.fixture.db4b364677", message: "Medication adherence" }) },
  { num: t({ id: "report.fixture.83daed65be", message: "87 days" }), label: t({ id: "report.fixture.d0bab8c9d0", message: "Seizure-free days" }) },
  { num: t({ id: "report.fixture.04cdc24e7b", message: "1 missed dose" }), label: t({ id: "report.fixture.29e7180467", message: "Missed doses" }) },
];

// marks: day-of-month -> 'attack' | 'period' (mini-month heatmap marks).
const months = [
  { year: 2026, month: 7, marks: { 13: 'period', 14: 'attack', 15: 'period' } },
  { year: 2026, month: 8, marks: { 9: 'period', 10: 'attack', 11: 'period' } },
  { year: 2026, month: 9, marks: { 13: 'period', 14: 'period', 22: 'attack' } },
];

const timeline = [
  {
    header: t({ id: "report.fixture.fb8bec333b", message: "2026-09-22 (Tue) - 1 seizure" }),
    meds: ['circle', 'circle'],
    clusters: [{ type: 't1', time: '14:30', text: t({ id: "report.fixture.b10aa9dd7a", message: "[T1] FAS (30 seconds)" }) }],
    remark: t({ id: "report.fixture.a753d9b93e", message: "Note: No specific trigger; seizure at the office." }),
  },
  {
    header: t({ id: "report.fixture.7965461cbe", message: "2026-08-10 (Mon) - 1 seizure" }),
    meds: ['circle', 'circle'],
    clusters: [{ type: 't2', time: '09:15', text: t({ id: "report.fixture.6f7ff008bc", message: "[T2] FIAS (1 minute)" }) }],
    remark: t({ id: "report.fixture.1061c662f9", message: "Note: Day 2 of period; poor sleep." }),
  },
  {
    header: t({ id: "report.fixture.0ee8c98397", message: "2026-07-14 (Tue) - 1 seizure" }),
    meds: ['circle', 'triangle'],
    missed: t({ id: "report.fixture.7cd9ffdbc5", message: "Missed evening dose" }),
    clusters: [{ type: 't2', time: '22:10', text: t({ id: "report.fixture.bc0cf185de", message: "[T2] FIAS (45 seconds)" }) }],
    remark: t({ id: "report.fixture.0a2d29f35c", message: "Note: Missed medication the previous evening; day before period." }),
  },
];

const footer = {
  left: t({ id: "report.fixture.1c8ebe35b5", message: "Key: [T1]=FAS | [T2]=FIAS | [T3]=Absence | [T4]=Myoclonic | [T5]=GTCS" }),
  right: t({ id: "report.fixture.342356a388", message: "EFHK Medical Diary PWA export (Level A)" }),
};

return { reportTitle, reportPeriod, patientInfo, stats, months, timeline, footer };
}
