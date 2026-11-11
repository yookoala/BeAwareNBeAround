// Hard-coded dashboard fixtures with values identical to
// efhk-diary-prototype/index.html (PLAN05 decision 3). The prototype's
// "today" is frozen to its sample date 2026-09-14 — no clock-dependent data.

// meds entries: 'taken' | 'missed' | '' (empty dot); [] = no med-dots row.
// lines entries: 'period' | 'illness'.
export const past7Days = [
  { name: '二', num: 8, meds: ['taken', 'taken', 'taken'] },
  { name: '三', num: 9, meds: ['taken', 'taken', 'taken'] },
  { name: '四', num: 10, meds: ['taken', 'taken', 'missed'] },
  { name: '五', num: 11, meds: ['taken', 'taken', 'taken'], eventDot: true },
  { name: '六', num: 12, meds: ['taken', 'taken', 'taken'], lines: ['period'] },
  { name: '日', num: 13, meds: ['taken', 'taken', 'taken'], lines: ['period', 'illness'] },
  { name: '一', num: 14, meds: ['taken', '', ''], lines: ['period', 'illness'], today: true },
];

export const thisWeekDays = [
  { name: '日', num: 13, meds: ['taken', 'taken', 'taken'], lines: ['period', 'illness'] },
  { name: '一', num: 14, meds: ['taken', '', ''], lines: ['period', 'illness'], today: true },
  { name: '二', num: 15, meds: [], lines: ['period'] },
  { name: '三', num: 16, meds: [], lines: ['period'] },
  { name: '四', num: 17, meds: [], lines: ['illness'] },
  { name: '五', num: 18, meds: [], lines: ['illness'] },
  { name: '六', num: 19, meds: [], lines: ['illness'] },
];

// Monthly modal: September 2026 (month starts on a Tuesday → 2 empty cells).
export const monthTitle = '2026年 9月 記錄';
export const monthHeaderDays = ['日', '一', '二', '三', '四', '五', '六'];
export const hubKeys = ['social', 'events', 'about', 'courses', 'donate', 'contact'];
export const monthEmptyCells = 2;
export const monthDays = [
  { num: 1, meds: ['taken', 'taken'] },
  { num: 2, meds: ['taken', 'taken'] },
  { num: 3, meds: ['taken', 'taken', 'missed'] },
  { num: 4, meds: ['taken', 'taken'], eventDot: true },
  { num: 5, meds: ['taken', 'taken'] },
  { num: 6, meds: ['taken', 'taken'] },
  { num: 7, meds: ['taken', 'taken'] },
  { num: 8, meds: ['taken', 'taken'] },
  { num: 9, meds: ['taken', 'taken'] },
  { num: 10, meds: ['taken', 'taken', 'missed'] },
  { num: 11, meds: ['taken', 'taken'], eventDot: true },
  { num: 12, meds: ['taken', 'taken'], lines: ['period'] },
  { num: 13, meds: ['taken', 'taken'], lines: ['period', 'illness'] },
  { num: 14, meds: ['taken', ''], lines: ['period', 'illness'], today: true },
  // Days 15–30: future days, empty indicator rows only.
  ...Array.from({ length: 16 }, (_, i) => ({ num: i + 15, meds: [] })),
];

// Same hotlinked URL as the prototype; the visual harness intercepts it with
// the vendored logo fixture (tests/visual/fixtures/efhk-logo.png).
export const EFHK_LOGO_URL =
  'https://epilepsy.org.hk/wp-content/uploads/elementor/thumbs/EFHK-abb-Logo-Ver-圓底-rsi4tzw9b949vi84j6y5gkdzbj2s5xn3mit7czgz2g.png';
