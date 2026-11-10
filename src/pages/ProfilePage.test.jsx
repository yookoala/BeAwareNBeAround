import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';
import { contactHrefs } from '../utils/contactLinks';

function Location() { return <div data-testid="location">{useLocation().pathname}</div>; }
function renderApp(locale = 'zh-HK') {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  return render(<I18nProvider i18n={i18n}><MemoryRouter initialEntries={['/diary/profile']}><Location /><AppRoutes /></MemoryRouter></I18nProvider>);
}
function open(container, id) { const section = container.querySelector(`[data-testid="accordion-${id}"]`); fireEvent.click(within(section).getByRole('button')); return section; }

test.each([
  ['zh-HK', '← 返回', '個人醫療檔案', '儲存'],
  ['zh-CN', '← 返回', '个人医疗档案', '保存'],
  ['en', '← Back', 'Medical Profile', 'Save'],
])('localized profile and shared shell in %s', (locale, back, title, save) => {
  const { container } = renderApp(locale);
  const header = container.querySelector('.diary-subheader');
  expect(within(header).getByRole('button', { name: back })).toHaveAttribute('type', 'button');
  expect(within(header).getByText(title)).toBeVisible();
  expect(within(header).getByRole('button', { name: save })).toBeVisible();
  expect(container.querySelectorAll('header')).toHaveLength(1);
  expect(container.querySelector('.bottom-nav a[href="/diary"]')).toHaveAttribute('aria-current', 'page');
  fireEvent.click(within(header).getByRole('button', { name: back }));
  expect(screen.getByTestId('location')).toHaveTextContent('/diary');
  expect(document.body).not.toHaveClass('page-profile');
});

test('accordion buttons operate independently and content clicks do not close them', () => {
  const { container } = renderApp();
  const ids = ['basics', 'meds', 'contacts', 'auras', 'triggers', 'investigations'];
  for (const id of ids) {
    const section = open(container, id);
    expect(section).toHaveClass('active');
    expect(within(section).getByRole('button', { expanded: true })).toBeVisible();
    fireEvent.click(section.querySelector('.accordion-content'));
    expect(section).toHaveClass('active');
  }
  fireEvent.click(within(container.querySelector('[data-testid="accordion-basics"]')).getByRole('button', { expanded: true }));
  expect(container.querySelector('[data-testid="accordion-basics"]')).not.toHaveClass('active');
  for (const id of ids.slice(1)) expect(container.querySelector(`[data-testid="accordion-${id}"]`)).toHaveClass('active');
});

test('contact links update and added contacts can be removed', () => {
  const { container } = renderApp();
  const section = open(container, 'contacts');
  const first = section.querySelector('.contact-card');
  expect(first.querySelector('.remove-btn')).toBeNull();
  fireEvent.change(first.querySelector('.phone-input'), { target: { value: '+852 9876-5432' } });
  expect(first.querySelector('.call-link')).toHaveAttribute('href', 'tel:+85298765432');
  expect(first.querySelector('.sms-link').getAttribute('href')).toMatch(/^sms:\+85298765432\?body=/);
  expect(first.querySelector('.wa-link').getAttribute('href')).toMatch(/^https:\/\/wa\.me\/85298765432\?text=/);
  fireEvent.click(within(section).getByRole('button', { name: '+ 新增聯絡人' }));
  expect(section.querySelectorAll('.contact-card')).toHaveLength(2);
  fireEvent.click(section.querySelector('.contact-card .remove-btn'));
  expect(section.querySelectorAll('.contact-card')).toHaveLength(1);
});

test.each(['', '+', '   ', '()-'])('digitless phone %j has no emergency links', (phone) => {
  expect(contactHrefs(phone, 'Emergency')).toEqual({ call: '#', sms: '#', wa: '#' });
});

test.each([
  ['zh-HK', '緊急通知：我目前可能正在經歷腦癇發作，請協助我。'],
  ['zh-CN', '紧急通知：我目前可能正在经历脑痫发作，请协助我。'],
  ['en', 'Emergency notice: I may currently be experiencing a seizure, please assist me.'],
])('emergency contact links use the %s message', (locale, message) => {
  const { container } = renderApp(locale);
  const section = open(container, 'contacts');
  fireEvent.change(section.querySelector('.phone-input'), { target: { value: '+852 9876-5432' } });
  expect(section.querySelector('.sms-link')).toHaveAttribute('href', `sms:+85298765432?body=${encodeURIComponent(message)}`);
  expect(section.querySelector('.wa-link')).toHaveAttribute('href', `https://wa.me/85298765432?text=${encodeURIComponent(message)}`);
});

test('tag selections survive locale change and custom items can be added and removed', () => {
  const { container } = renderApp();
  const auras = open(container, 'auras');
  const triggers = open(container, 'triggers');
  const contacts = open(container, 'contacts');
  const investigations = open(container, 'investigations');
  for (const id of ['a1', 'a8', 't1', 't7', 'l1', 'l8']) fireEvent.click(container.querySelector(`label[for="${id}"]`));
  const phone = contacts.querySelector('.phone-input');
  fireEvent.change(phone, { target: { value: '+852 9876-5432' } });
  const auraList = auras.querySelector('#custom-aura-list');
  fireEvent.click(auraList.nextElementSibling);
  fireEvent.change(auraList.querySelector('input'), { target: { value: 'Rising sensation' } });
  fireEvent.click(within(investigations).getByRole('button', { name: '+ 新增檢查紀錄' }));
  const type = investigations.querySelectorAll('.investigation-card')[1].querySelector('select');
  fireEvent.change(type, { target: { value: 'MRI' } });
  fireEvent.click(screen.getByRole('button', { name: '語言' }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'EN' }));
  for (const id of ['a1', 'a8', 't1', 't7', 'l1', 'l8']) expect(container.querySelector(`#${id}`)).toBeChecked();
  expect(contacts.querySelector('.phone-input')).toHaveValue('+852 9876-5432');
  expect(auraList.querySelector('input')).toHaveValue('Rising sensation');
  expect(investigations.querySelectorAll('.investigation-card')[1].querySelector('select')).toHaveValue('MRI');
  const message = 'Emergency notice: I may currently be experiencing a seizure, please assist me.';
  expect(contacts.querySelector('.sms-link')).toHaveAttribute('href', `sms:+85298765432?body=${encodeURIComponent(message)}`);
  expect(contacts.querySelector('.wa-link')).toHaveAttribute('href', `https://wa.me/85298765432?text=${encodeURIComponent(message)}`);
  fireEvent.click(within(auraList).getByRole('button'));
  expect(auraList.querySelectorAll('input')).toHaveLength(0);
  const triggerList = triggers.querySelector('#custom-trigger-list');
  fireEvent.click(triggerList.nextElementSibling);
  expect(triggerList.querySelectorAll('input')).toHaveLength(1);
  fireEvent.click(within(triggerList).getByRole('button'));
  expect(triggerList.querySelectorAll('input')).toHaveLength(0);
});

test('investigations keep the initial card and remove additional cards', () => {
  const { container } = renderApp();
  const section = open(container, 'investigations');
  expect(section.querySelector('.investigation-card .remove-btn')).toBeNull();
  fireEvent.click(within(section).getByRole('button', { name: '+ 新增檢查紀錄' }));
  expect(section.querySelectorAll('.investigation-card')).toHaveLength(2);
  fireEvent.click(section.querySelector('.investigation-card .remove-btn'));
  expect(section.querySelectorAll('.investigation-card')).toHaveLength(1);
});

test.each([['zh-HK', '儲存', '檔案已儲存'], ['zh-CN', '保存', '档案已保存'], ['en', 'Save', 'Profile saved']])('save toast dismisses in %s', (locale, save, message) => {
  renderApp(locale); vi.useFakeTimers();
  fireEvent.click(screen.getByRole('button', { name: save }));
  expect(screen.getByRole('status')).toHaveTextContent(message);
  act(() => vi.advanceTimersByTime(2000));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  vi.useRealTimers();
});
