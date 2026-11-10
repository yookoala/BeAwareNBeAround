import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';

test('level A renders a landscape report without app chrome and toggles grayscale', () => {
  activateLocale('zh-HK');
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  const { container } = render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={['/diary/report/level-a']}><AppRoutes /></MemoryRouter></I18nProvider>);
  expect(screen.getByRole('button', { name: '← 返回日記' })).toBeVisible();
  expect(container.querySelector('main')).toHaveClass('main--report');
  expect(screen.queryByRole('link', { name: /腦癎錦囊/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  expect(container.querySelectorAll('.mini-month')).toHaveLength(3);
  for (const month of ['2026-07', '2026-08', '2026-09']) expect(screen.getByText(month)).toBeInTheDocument();
  expect(container.querySelectorAll('.timeline-date-group')).toHaveLength(3);
  const sheet = container.querySelector('#pdfContainer.a4-landscape');
  expect(sheet).not.toHaveClass('bw-mode');
  expect(container.querySelector('#modeStatus')).toHaveTextContent('目前模式：全彩 (Color)');
  fireEvent.click(screen.getByRole('button', { name: '切換 黑白/彩色 模式' }));
  expect(sheet).toHaveClass('bw-mode');
  expect(container.querySelector('#modeStatus')).toHaveTextContent('目前模式：黑白 (B&W / Grayscale)');
  fireEvent.click(screen.getByRole('button', { name: '← 返回日記' }));
  expect(screen.getByRole('link', { name: '日記' })).toHaveAttribute('aria-current', 'page');
});

test.each([
  ['zh-CN', '← 返回日记', '目前模式：全彩 (Color)', '长\u671f追踪门诊报告 (Level A - 季度概览)'],
  ['en', '← Back to Diary', 'Current mode: Color', 'Long-term outpatient report (Level A - Quarterly overview)'],
])('localizes report A in %s', (locale, back, mode, title) => {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={['/diary/report/level-a']}><AppRoutes /></MemoryRouter></I18nProvider>);
  expect(screen.getByRole('button', { name: back })).toBeVisible();
  expect(screen.getByRole('status')).toHaveTextContent(mode);
  expect(screen.getByRole('heading', { name: title })).toBeVisible();
});

test.each([
  ['zh-HK', '香港腦癇基金會', '發作日', '生理期/疾病', '已服藥', '漏服藥物'],
  ['zh-CN', '香港脑痫基金会', '发作日', '生理期/疾病', '已服药', '漏服药物'],
  ['en', 'Epilepsy Foundation of Hong Kong', 'Seizure day', 'Period/illness', 'Medication taken', 'Medication missed'],
])('exposes accessible report A clinical marks and logo in %s', (locale, logo, attack, period, taken, missed) => {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  const { container } = render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={['/diary/report/level-a']}><AppRoutes /></MemoryRouter></I18nProvider>);
  const attackCell = container.querySelector('.mini-month .mark-attack');
  const periodCell = container.querySelector('.mini-month .mark-period');
  expect(attackCell).toHaveAttribute('role', 'img');
  expect(attackCell).toHaveAccessibleName(`2026-07-14, ${attack}`);
  expect(attackCell).toHaveTextContent('14');
  expect(periodCell).toHaveAttribute('role', 'img');
  expect(periodCell).toHaveAccessibleName(`2026-07-13, ${period}`);
  expect(container.querySelector('.mini-day:not(.empty):not(.mark-attack):not(.mark-period)')).not.toHaveAttribute('aria-label');
  expect(container.querySelectorAll('.css-circle').length).toBeGreaterThan(0);
  expect(container.querySelectorAll('.css-triangle').length).toBeGreaterThan(0);
  for (const cell of container.querySelectorAll('.css-circle')) {
    expect(cell).toHaveAttribute('role', 'img');
    expect(cell).toHaveAccessibleName(taken);
  }
  for (const cell of container.querySelectorAll('.css-triangle')) {
    expect(cell).toHaveAttribute('role', 'img');
    expect(cell).toHaveAccessibleName(missed);
  }
  expect(container.querySelector('.pdf-logo-img')).toHaveAccessibleName(logo);
});
