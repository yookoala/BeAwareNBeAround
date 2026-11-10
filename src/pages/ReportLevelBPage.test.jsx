import { fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter } from 'react-router-dom';
import { test, expect, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';

test('level B renders three portrait pages without app chrome and toggles grayscale', () => {
  activateLocale('zh-HK');
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  const { container } = render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={['/diary/report/level-b']}><AppRoutes /></MemoryRouter></I18nProvider>);
  expect(screen.getByRole('button', { name: '← 返回日記' })).toBeVisible();
  expect(screen.queryByRole('link', { name: /腦癎錦囊/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  expect(container.querySelectorAll('.a4-portrait')).toHaveLength(3);
  expect(container.querySelectorAll('.section-title')).toHaveLength(6);
  expect(container.querySelectorAll('.data-table')).toHaveLength(3);
  expect(container.querySelectorAll('.month-divider')).toHaveLength(6);
  const sheet = container.querySelector('#pdfContainer.page-container');
  fireEvent.click(screen.getByRole('button', { name: '切換 黑白/彩色 模式' }));
  expect(sheet).toHaveClass('bw-mode');
  expect(container.querySelector('#modeStatus')).toHaveTextContent('目前模式：黑白 (B&W / Grayscale)');
  fireEvent.click(screen.getByRole('button', { name: '← 返回日記' }));
  expect(screen.getByRole('link', { name: '日記' })).toHaveAttribute('aria-current', 'page');
});

test.each([
  ['zh-CN', '← 返回日记', '开始日期', '医疗共病症 (Medical Co-morbidities)'],
  ['en', '← Back to Diary', 'Start date', 'Medical Co-morbidities'],
])('localizes report B tables and fixture labels in %s', (locale, back, column, label) => {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={['/diary/report/level-b']}><AppRoutes /></MemoryRouter></I18nProvider>);
  expect(screen.getByRole('button', { name: back })).toBeVisible();
  expect(screen.getByRole('columnheader', { name: column })).toBeVisible();
  expect(screen.getByText(label)).toBeVisible();
});

test('localizes investigation findings and family relationships in Chinese reports', () => {
  activateLocale('zh-HK');
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={['/diary/report/level-b']}><AppRoutes /></MemoryRouter></I18nProvider>);
  expect(screen.getByText('血液檢查')).toBeVisible();
  expect(screen.getByText('未進行')).toBeVisible();
  expect(screen.getByText('陳太太（妻子）')).toBeVisible();
});

test.each([
  ['zh-HK', '香港腦癇基金會', '已服藥', '漏服藥物'],
  ['zh-CN', '香港脑痫基金会', '已服药', '漏服药物'],
  ['en', 'Epilepsy Foundation of Hong Kong', 'Medication taken', 'Medication missed'],
])('exposes accessible report B medication marks and logo in %s', (locale, logo, taken, missed) => {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  const { container } = render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={['/diary/report/level-b']}><AppRoutes /></MemoryRouter></I18nProvider>);
  const circles = container.querySelectorAll('.css-circle');
  const triangles = container.querySelectorAll('.css-triangle');
  expect(circles.length).toBeGreaterThan(0);
  expect(triangles.length).toBeGreaterThan(0);
  for (const cell of circles) {
    expect(cell).toHaveAttribute('role', 'img');
    expect(cell).toHaveAccessibleName(taken);
  }
  for (const cell of triangles) {
    expect(cell).toHaveAttribute('role', 'img');
    expect(cell).toHaveAccessibleName(missed);
  }
  expect(container.querySelector('.pdf-logo-img')).toHaveAccessibleName(logo);
});
