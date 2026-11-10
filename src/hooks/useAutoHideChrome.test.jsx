import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, test } from 'vitest';
import { useAutoHideChrome } from './useAutoHideChrome';

function setScrollMetrics({ scrollY = 0, innerHeight = 800 } = {}) {
  Object.defineProperty(window, 'innerHeight', { value: innerHeight, configurable: true, writable: true });
  Object.defineProperty(window, 'scrollY', { value: scrollY, configurable: true, writable: true });
}

function scrollToY(y) {
  act(() => {
    window.scrollY = y;
    window.dispatchEvent(new Event('scroll'));
  });
}

beforeEach(() => {
  setScrollMetrics({ scrollY: 0, innerHeight: 800 });
});

test('starts visible and hides when scrolling down', () => {
  const { result } = renderHook(() => useAutoHideChrome());

  expect(result.current).toBe(false);

  scrollToY(120);
  expect(result.current).toBe(true);
});

test('stays hidden on upward scroll smaller than 5vh and reveals once cumulative upward scroll reaches 5vh', () => {
  setScrollMetrics({ scrollY: 0, innerHeight: 800 }); // 5vh = 40px
  const { result } = renderHook(() => useAutoHideChrome());

  scrollToY(200);
  expect(result.current).toBe(true);

  // Scroll up by 25px (< 40px): still hidden.
  scrollToY(175);
  expect(result.current).toBe(true);

  // Scroll up by another 14px (total 39px < 40px): still hidden.
  scrollToY(161);
  expect(result.current).toBe(true);

  // Scroll up to 160 (total 40px === 5vh): reveals.
  scrollToY(160);
  expect(result.current).toBe(false);
});

test('resets the upward distance anchor if the user scrolls down again before reaching 5vh', () => {
  setScrollMetrics({ scrollY: 0, innerHeight: 800 }); // 5vh = 40px
  const { result } = renderHook(() => useAutoHideChrome());

  scrollToY(200);
  expect(result.current).toBe(true);

  // Scroll up 30px (< 40px), then scroll down to 220.
  scrollToY(170);
  expect(result.current).toBe(true);
  scrollToY(220);
  expect(result.current).toBe(true);

  // Now must scroll up at least 40px from 220 (i.e. to <= 180) to reveal.
  scrollToY(185);
  expect(result.current).toBe(true);

  scrollToY(180);
  expect(result.current).toBe(false);
});

test('always reveals when scrolled back to the top (scrollY <= 0) even if total scroll was less than 5vh', () => {
  setScrollMetrics({ scrollY: 0, innerHeight: 800 }); // 5vh = 40px
  const { result } = renderHook(() => useAutoHideChrome());

  scrollToY(20);
  expect(result.current).toBe(true);

  scrollToY(0);
  expect(result.current).toBe(false);
});
