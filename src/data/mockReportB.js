import { t } from '@lingui/core/macro';

export function getReportB() {
// Mock content for the Level B report, values identical to
// efhk-diary-prototype/report-level-b.html (frozen export date 2026-09-20,
// PLAN05 no-clock rule).
//
// Cell models:
// - text cells: { text, bold?, color? }
// - dose cells: { text, bold?, tag?: { cls, label } }
// - remark cells: string or array of { bold } / { text } segments; the
//   segment texts carry the prototype's exact spacing (e.g. leading space
//   after a bold label).

const footerLeft = t({ id: "report.fixture.e23b130c55", message: "[T1]=FAS | [T2]=FIAS | [T5]=GTCS | Medication: ● Taken / △ Missed" });

const pages = [
  {
    header: {
      logo: true,
      title: t({ id: "report.fixture.4d13913b8c", message: "Complete epilepsy diary history (Level B)" }),
      meta: t({ id: "report.fixture.02f5e456ad", message: "Export date: 2026-09-20 | Page: 1 / 3" }),
    },
    footer: { left: footerLeft, right: t({ id: "report.fixture.03446a58f6", message: "Epilepsy Foundation of Hong Kong PWA export (Page 1)" }) },
  },
  {
    header: {
      continuation: t({ id: "report.fixture.77e94207d6", message: "EFHK complete epilepsy diary history (continued)" }),
      meta: t({ id: "report.fixture.8d908e3428", message: "Export date: 2026-09-20 | Page: 2 / 3" }),
    },
    footer: { left: footerLeft, right: t({ id: "report.fixture.f6f7ae3a9e", message: "Epilepsy Foundation of Hong Kong PWA export (Page 2)" }) },
  },
  {
    header: {
      continuation: t({ id: "report.fixture.77e94207d6", message: "EFHK complete epilepsy diary history (continued)" }),
      meta: t({ id: "report.fixture.5b4fadcf5c", message: "Export date: 2026-09-20 | Page: 3 / 3" }),
    },
    footer: { left: footerLeft, right: t({ id: "report.fixture.519df040d6", message: "Epilepsy Foundation of Hong Kong PWA export (Page 3)" }) },
  },
];

const sectionTitles = {
  profile: t({ id: "report.fixture.170098cbfb", message: "👤 1. Personal Information & Emergency Contact" }),
  diagnosis: t({ id: "report.fixture.453f85d515", message: "🏥 2. Diagnosis & Medical History" }),
  investigations: t({ id: "report.fixture.b40e4fbf02", message: "🔬 3. Investigation Findings" }),
  medications: t({ id: "report.fixture.50000f6273", message: "💊 4. Medication History" }),
  ledgerRecent: t({ id: "report.fixture.0344073394", message: "📅 5. Comprehensive Daily Ledger - Recent records" }),
  ledgerHistory: t({ id: "report.fixture.d0ecf4d13d", message: "📅 5. Comprehensive Daily Ledger - Historical records" }),
};

const profileItems = [
  { label: t({ id: "report.fixture.fb47d6452a", message: "Name" }), value: 'Chan T. M. (P-2026-09)' },
  {
    row: true,
    items: [
      { label: t({ id: "report.fixture.51f1de45f2", message: "Sex" }), value: t({ id: "report.fixture.2aaa0d912e", message: "Male" }) },
      { label: t({ id: "report.fixture.1c37b940d2", message: "Date of birth / Age" }), value: t({ id: "report.fixture.fe56e8096a", message: "1985-08-20 / 41 years" }) },
    ],
  },
  { label: t({ id: "report.fixture.658aba3a92", message: "Next of Kin" }), value: t({ id: "report.fixture.fd5436428e", message: "Mrs. Chan (Wife)" }) },
  { label: t({ id: "report.fixture.bbea8c0e39", message: "Emergency Contact" }), value: '+852 9123-4567' },
];

const diagnosisItems = [
  {
    label: t({ id: "report.fixture.89df301249", message: "Type of Seizure" }),
    value: t({ id: "report.fixture.434b94fc8b", message: "Focal Impaired Awareness (FIAS), Secondary GTCS" }),
  },
  { label: t({ id: "report.fixture.1ef47edf35", message: "Age of Onset" }), value: t({ id: "report.fixture.dcde6d5c14", message: "37 years (2022)" }) },
  { label: t({ id: "report.fixture.79efc63abc", message: "Family History" }), value: t({ id: "report.fixture.7b7a8d3ca9", message: "Nil (no family history of epilepsy)" }) },
  { label: t({ id: "report.fixture.76633160fb", message: "Medical Co-morbidities" }), value: t({ id: "report.fixture.767ac9fc1b", message: "No major chronic conditions; physically well." }) },
];

const investigationItems = [
  { label: t({ id: "report.fixture.ad31d6c0c6", message: "MRI / CT Scan" }), value: t({ id: "report.fixture.5f32a7c784", message: "Normal (2022-04)" }) },
  { label: t({ id: "report.fixture.adb5ea2bd5", message: "EEG" }), value: t({ id: "report.fixture.092a91096a", message: "Right temporal sharp waves" }) },
  { label: t({ id: "report.fixture.41277ad2e9", message: "Blood Test" }), value: t({ id: "report.fixture.8630962596", message: "Normal (2025-11)" }) },
  { label: t({ id: "report.fixture.2a9ae2751b", message: "Genetic Test" }), value: t({ id: "report.fixture.0c6a8939af", message: "Not performed" }) },
  { label: t({ id: "report.fixture.e66bf16043", message: "ECG" }), value: t({ id: "report.fixture.c687bd7d35", message: "Normal Sinus Rhythm" }) },
  { label: t({ id: "report.fixture.3d4c6cd105", message: "Echocardiogram" }), value: t({ id: "report.fixture.9a4dca4f30", message: "No structural defect" }) },
  {
    label: t({ id: "report.fixture.1483158f58", message: "Others" }),
    value:
      t({ id: "report.fixture.69b59da68a", message: "2026-06 Therapeutic drug monitoring (TDM): Levetiracetam at target; Lamotrigine at the low end of the therapeutic range." }),
    span: 3,
  },
];

const medColumns = [
  { label: t({ id: "report.fixture.7fd7a227e9", message: "Start date" }), width: '10%' },
  { label: t({ id: "report.fixture.27eefa5237", message: "End date" }), width: '10%' },
  { label: t({ id: "report.fixture.84fdc9e979", message: "Medication" }), width: '17%' },
  { label: t({ id: "report.fixture.a38b5988c5", message: "Dose and frequency" }), width: '16%' },
  { label: t({ id: "report.fixture.ee9f9e7a1b", message: "Reason for change" }), width: '23%' },
  { label: t({ id: "report.fixture.cf680abeb6", message: "Results" }), width: '24%' },
];

const medRows = [
  {
    status: 'med-discontinued',
    start: { text: '2022-04-15' },
    end: { text: '2023-05-09' },
    name: { text: 'Valproate (Epilim)' },
    dose: { text: '400mg BID' },
    why: t({ id: "report.fixture.79616fe840", message: "Initial medication after diagnosis." }),
    results: t({ id: "report.fixture.6b9307910c", message: "Seizure frequency halved, but breakthrough seizures continued." }),
  },
  {
    status: 'med-discontinued',
    start: { text: '2023-05-10' },
    end: { text: '2024-02-14' },
    name: { text: 'Valproate (Epilim)' },
    dose: { text: '600mg BID', bold: true, tag: { cls: 'tag-up', label: t({ id: "report.fixture.550a68731d", message: "[Increase ↑]" }) } },
    why: t({ id: "report.fixture.28c785aa29", message: "Suboptimal control: dose increased to achieve complete control." }),
    results: t({ id: "report.fixture.71527482ed", message: "Fewer seizures, but severe hand tremor developed." }),
  },
  {
    status: 'med-discontinued',
    start: { text: '2024-02-15' },
    end: { text: '2024-05-31' },
    name: { text: 'Valproate (Epilim)' },
    dose: { text: '300mg BID', bold: true, tag: { cls: 'tag-down', label: t({ id: "report.fixture.87b3878c2a", message: "[Decrease ↓]" }) } },
    why: t({ id: "report.fixture.28013118c3", message: "Side effects: hand tremor prevented fine work; began tapering off." }),
    results: t({ id: "report.fixture.ed147a309e", message: "Hand tremor gradually improved." }),
  },
  {
    status: 'med-discontinued',
    start: { text: '2024-02-15' },
    end: { text: '2024-05-31' },
    name: { text: 'Levetiracetam' },
    dose: { text: '500mg BID', tag: { cls: 'tag-add', label: t({ id: "report.fixture.ff4f94d077", message: "[Added +]" }) } },
    why: t({ id: "report.fixture.2548a68c6b", message: "Bridge medication while discontinuing the previous drug." }),
    results: t({ id: "report.fixture.a299824c2d", message: "No major seizures during transition." }),
  },
  {
    status: 'med-active',
    start: { text: '2024-06-01', bold: true },
    end: { text: t({ id: "report.fixture.7951e5a61a", message: "Current" }), bold: true, color: '#34C759' },
    name: { text: 'Levetiracetam', bold: true },
    dose: { text: '1000mg BID', bold: true, tag: { cls: 'tag-up', label: t({ id: "report.fixture.550a68731d", message: "[Increase ↑]" }) } },
    why: t({ id: "report.fixture.12e71de040", message: "Previous drug discontinued; increased to target monotherapy dose." }),
    results: t({ id: "report.fixture.c6ec68da40", message: "Well tolerated; no GTCS for over a year." }),
  },
  {
    status: 'med-discontinued',
    start: { text: '2025-11-20' },
    end: { text: '2026-06-10' },
    name: { text: 'Lamotrigine' },
    dose: { text: '25mg QD', tag: { cls: 'tag-add', label: t({ id: "report.fixture.ff4f94d077", message: "[Added +]" }) } },
    why: t({ id: "report.fixture.e92943ac50", message: "Suboptimal control: stress triggered frequent FIAS; added second-line medication." }),
    results: t({ id: "report.fixture.f525bfca0b", message: "Seizures decreased; no allergic rash." }),
  },
  {
    status: 'med-active',
    start: { text: '2026-06-11', bold: true },
    end: { text: t({ id: "report.fixture.7951e5a61a", message: "Current" }), bold: true, color: '#34C759' },
    name: { text: 'Lamotrigine', bold: true },
    dose: { text: '50mg QD', bold: true, tag: { cls: 'tag-up', label: t({ id: "report.fixture.550a68731d", message: "[Increase ↑]" }) } },
    why: t({ id: "report.fixture.24026fa896", message: "TDM showed low blood levels; dose increased for high-stress activity." }),
    results: t({ id: "report.fixture.71b93e51ad", message: "Excellent control on two medications; physical and cognitive function normal." }),
  },
];

const ledgerColumns = [
  { label: t({ id: "report.fixture.b6fed9af83", message: "Date" }), width: '14%' },
  { label: t({ id: "report.fixture.09558b2cc6", message: "Time" }), width: '8%' },
  { label: t({ id: "report.fixture.cd4e4c42a0", message: "Seizure events and duration" }), width: '25%' },
  { label: t({ id: "report.fixture.62f790cc83", message: "Medication" }), width: '10%' },
  { label: t({ id: "report.fixture.070954405d", message: "Detailed notes on triggers, side effects and health" }), width: '43%' },
];

// Ledger rows: times: string[] (joined with <br>); events: [{ type, label,
// duration }] or eventsText string; meds: ('circle'|'triangle')[] joined with
// a space; remark: string or {bold}/{text} segments.
const ledgerMonthsRecent = [
  {
    divider: t({ id: "report.fixture.cdc6858391", message: "📁 September 2026 records" }),
    rows: [
      {
        date: '2026-09-15',
        times: ['14:30', '16:00'],
        events: [
          { type: 't1', label: '[T1] FAS', duration: '30s' },
          { type: 't1', label: '[T1] FAS', duration: '20s' },
        ],
        meds: ['circle', 'triangle'],
        remark:
          t({ id: "report.fixture.0b5c02529e", message: "[Cluster seizures] Extreme work stress. Forgot morning medication; two brief auras (right-hand numbness) in the afternoon." }),
      },
      {
        date: '2026-09-02',
        times: ['-'],
        eventsText: t({ id: "report.fixture.aea96932a4", message: "- (No seizures)" }),
        meds: ['circle', 'circle'],
        remark: [
          { bold: t({ id: "report.fixture.252475c9cb", message: "Status:" }) },
          { text: t({ id: "report.fixture.f9cabc0f8b", message: " Mild cold (URTI) | " }) },
          { bold: t({ id: "report.fixture.5a17596e16", message: "Side effects:" }) },
          { text: t({ id: "report.fixture.06e4c0a150", message: " Unusual drowsiness after taking cold medication." }) },
        ],
      },
    ],
  },
  {
    divider: t({ id: "report.fixture.c6b980099e", message: "📁 June 2026 records" }),
    rows: [
      {
        date: '2026-06-11',
        times: ['-'],
        eventsText: '-',
        meds: ['circle', 'circle'],
        remark: [
          { bold: t({ id: "report.fixture.5f83181d81", message: "System note:" }) },
          {
            text:
              t({ id: "report.fixture.cc66506466", message: " Outpatient review. Doctor increased Lamotrigine from 25mg to 50mg for upcoming strenuous activity overseas." }),
          },
        ],
      },
      {
        date: '2026-06-05',
        times: ['08:15'],
        events: [{ type: 't2', label: '[T2] FIAS', duration: '1m' }],
        meds: ['circle', 'circle'],
        remark:
          t({ id: "report.fixture.a1cf3b489b", message: "Preparing for a major marathon overseas. Lack of sleep while packing; brief impaired awareness, fully alert after about 5 minutes." }),
      },
    ],
  },
  {
    divider: t({ id: "report.fixture.5a0208dccb", message: "📁 May 2026 records" }),
    rows: [
      {
        date: '2026-05-22',
        times: ['22:30'],
        events: [{ type: 't5', label: '[T5] GTCS', duration: '2m' }],
        meds: ['circle', 'circle'],
        remark: [
          { bold: t({ id: "report.fixture.0ac4da82de", message: "Major event:" }) },
          {
            text:
              t({ id: "report.fixture.85d71d8861", message: " During intense outdoor trail training, bad weather and 12 hours of focused climbing triggered a generalized tonic-clonic seizure. Teammates helped into the recovery position; headache and fatigue afterwards." }),
          },
        ],
      },
      {
        date: '2026-05-21',
        times: ['-'],
        eventsText: '-',
        meds: ['circle', 'circle'],
        remark: [{ bold: t({ id: "report.fixture.252475c9cb", message: "Status:" }) }, { text: t({ id: "report.fixture.6a3f9cacc8", message: " Extreme fatigue. Second day of trail training." }) }],
      },
    ],
  },
];

const ledgerMonthsHistory = [
  {
    divider: t({ id: "report.fixture.8cd5c1d2e6", message: "📁 November 2025 records" }),
    rows: [
      {
        date: '2025-11-19',
        times: ['09:00', '13:15', '18:40'],
        events: [
          { type: 't2', label: '[T2] FIAS', duration: '45s' },
          { type: 't2', label: '[T2] FIAS', duration: '1m' },
          { type: 't1', label: '[T1] FAS', duration: '20s' },
        ],
        meds: ['circle', 'circle'],
        remark:
          t({ id: "report.fixture.b84c074e37", message: "[Severe cluster seizures] Jet lag and heavy workload after returning from a long business trip to Europe. Multiple breakthrough seizures in one day; contacted the clinic for an earlier review. (Lamotrigine added the next day.)" }),
      },
      {
        date: '2025-11-15',
        times: ['-'],
        eventsText: '-',
        meds: ['circle', 'circle'],
        remark: [{ bold: t({ id: "report.fixture.252475c9cb", message: "Status:" }) }, { text: t({ id: "report.fixture.3da1b944e0", message: " Severe jet lag. Returned to Hong Kong from London." }) }],
      },
    ],
  },
  {
    divider: t({ id: "report.fixture.0ac7615fe7", message: "📁 February 2024 records" }),
    rows: [
      {
        date: '2024-02-14',
        times: ['-'],
        eventsText: '-',
        meds: ['circle', 'circle'],
        remark: [
          { bold: t({ id: "report.fixture.5f83181d81", message: "System note:" }) },
          { text: t({ id: "report.fixture.ba92146327", message: " Doctor instructed a gradual Valproate taper and introduced Levetiracetam." }) },
        ],
      },
      {
        date: '2024-02-10',
        times: ['07:30'],
        events: [{ type: 't5', label: '[T5] GTCS', duration: '1.5m' }],
        meds: ['circle', 'circle'],
        remark:
          t({ id: "report.fixture.cf20cd9e7a", message: "Occurred on waking. Worsening hand tremor from Valproate made fine instrument work difficult and caused significant stress." }),
      },
    ],
  },
  {
    divider: t({ id: "report.fixture.3f02afb892", message: "📁 May 2023 records" }),
    rows: [
      {
        date: '2023-05-08',
        times: ['15:20'],
        events: [{ type: 't2', label: '[T2] FIAS', duration: '1m' }],
        meds: ['circle', 'circle'],
        remark: t({ id: "report.fixture.c7d2aa6698", message: "Occurred during a meeting; colleagues noticed repeated hand rubbing. (At review two days later the doctor increased Valproate to 600mg.)" }),
      },
    ],
  },
];

const closingNote = t({ id: "report.fixture.7c32d40e5e", message: "--- End of system records; all historical data shown in full ---" });

return { footerLeft, pages, sectionTitles, profileItems, diagnosisItems, investigationItems, medColumns, medRows, ledgerColumns, ledgerMonthsRecent, ledgerMonthsHistory, closingNote };
}
