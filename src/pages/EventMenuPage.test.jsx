import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

function renderApp(locale = 'zh-HK') {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  return render(
    <I18nProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/diary/event']}>
        <Location />
        <AppRoutes />
      </MemoryRouter>
    </I18nProvider>,
  );
}

test.each([
  ['zh-HK', '← 返回', '新增記錄', ['腦癇記錄', '頭痛記錄', '服藥記錄', '副作用', '生理及健康']],
  ['zh-CN', '← 返回', '新增记录', ['癫痫记录', '头痛记录', '服药记录', '副作用', '生理及健康']],
  ['en', '← Back', 'New Entry', ['Seizure record', 'Headache record', 'Medication record', 'Side effects', 'Physiology and health']],
])('renders the single-column 5-icon event menu in %s without the main app header', (locale, back, title, labels) => {
  const { container } = renderApp(locale);
  expect(container.querySelector('.app-header')).toBeNull();
  const subheader = container.querySelector('.diary-subheader');
  expect(within(subheader).getByRole('button', { name: back })).toBeVisible();
  expect(within(subheader).getByText(title)).toBeVisible();
  expect(within(subheader).queryByRole('button', { name: /儲存|保存|Save/ })).toBeNull();
  expect(container.querySelector('.bottom-nav a[href="/diary"]')).toHaveAttribute('aria-current', 'page');

  const buttons = container.querySelectorAll('.event-menu-list .event-menu-btn');
  expect(buttons).toHaveLength(5);
  const ids = ['btn-attack', 'btn-headache', 'btn-meds', 'btn-side', 'btn-health'];
  buttons.forEach((button, index) => {
    expect(button.id).toBe(ids[index]);
    expect(button).toHaveTextContent(labels[index]);
  });
});

test.each([
  ['#btn-attack', '/diary/event/seizure'],
  ['#btn-headache', '/diary/event/headache'],
  ['#btn-meds', '/diary/event/medication'],
  ['#btn-side', '/diary/event/side-effects'],
  ['#btn-health', '/diary/event/health'],
])('clicking %s navigates to %s with vt-slide-in-right', async (selector, destination) => {
  let finishTransition;
  document.startViewTransition = vi.fn((callback) => {
    callback();
    return {
      finished: new Promise((resolve) => {
        finishTransition = resolve;
      }),
    };
  });
  try {
    const { container } = renderApp();
    fireEvent.click(container.querySelector(selector));
    expect(document.startViewTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveClass('vt-slide-in-right');
    expect(screen.getByTestId('location')).toHaveTextContent(destination);
    await act(async () => {
      finishTransition();
    });
  } finally {
    delete document.startViewTransition;
  }
});

test('back button returns to /diary with vt-slide-out-right', async () => {
  let finishTransition;
  document.startViewTransition = vi.fn((callback) => {
    callback();
    return {
      finished: new Promise((resolve) => {
        finishTransition = resolve;
      }),
    };
  });
  try {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: '← 返回' }));
    expect(document.startViewTransition).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveClass('vt-slide-out-right');
    expect(screen.getByTestId('location')).toHaveTextContent('/diary');
    await act(async () => {
      finishTransition();
    });
  } finally {
    delete document.startViewTransition;
  }
});
