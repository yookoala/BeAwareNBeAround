import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@lingui/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import { AppRoutes } from '../App';
import { activateLocale, i18n } from '../i18n/setup';

function renderResource(locale = 'zh-HK') {
  activateLocale(locale);
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ status: 'success', metrics: {} }) })));
  return render(
    <I18nProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/resource']}>
        <AppRoutes />
      </MemoryRouter>
    </I18nProvider>,
  );
}

test('renders the Resource view with official website, 6 single-column resource items, and More Links linktree', () => {
  const { container } = renderResource('zh-HK');
  expect(screen.getByRole('link', { name: '資源' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('heading', { name: '香港腦癇基金會 資源中心' })).toBeVisible();

  const websiteLink = screen.getByRole('link', { name: /香港腦癎基金會/ });
  expect(websiteLink).toHaveAttribute('href', 'https://epilepsy.org.hk/');

  const linktreeLink = screen.getByRole('link', { name: /更多連結/ });
  expect(linktreeLink).toHaveAttribute('href', 'https://linktr.ee/EpilepsyFoundationOfHongKong');

  for (const label of ['🌐 社交媒體', '📅 最新活動', 'ℹ️ 關於我們', '📚 網上課程', '💖 捐款支持', '📞 聯絡我們']) {
    expect(screen.getByRole('button', { name: new RegExp(label) })).toBeVisible();
  }
  expect(container.querySelectorAll('.resource-list .resource-item')).toHaveLength(8);
});

test.each([
  ['zh-CN', '资源', '香港脑痫基金会 (官方网站)', '更多链接'],
  ['en', 'Resource', 'Epilepsy Foundation of Hong Kong (Official Website)', 'More Links'],
])('localizes the Resource view in %s', (locale, tabName, websiteLabel, moreLinksLabel) => {
  renderResource(locale);
  expect(screen.getByRole('link', { name: tabName })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: new RegExp(websiteLabel.replace(/[()]/g, '\\$&')) })).toHaveAttribute('href', 'https://epilepsy.org.hk/');
  expect(screen.getByRole('link', { name: new RegExp(moreLinksLabel) })).toHaveAttribute('href', 'https://linktr.ee/EpilepsyFoundationOfHongKong');
});
