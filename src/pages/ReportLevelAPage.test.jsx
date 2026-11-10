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
