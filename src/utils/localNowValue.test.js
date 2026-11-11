import { afterEach, describe, expect, it, vi } from 'vitest';
import { localNowValue } from './localNowValue';

afterEach(() => {
  vi.useRealTimers();
});

describe('localNowValue', () => {
  it('formats the current local wall-clock time as a datetime-local value with padded parts', () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 7, 9, 5) });
    expect(localNowValue()).toBe('2026-09-07T09:05');
  });

  it('renders the host local wall clock, never UTC fields', () => {
    const instant = new Date('2026-09-14T23:30:00Z');
    vi.useFakeTimers({ now: instant });
    // Shift the instant by the host's UTC offset, then read it as UTC fields:
    // that yields the host's local wall clock without depending on Intl data.
    const local = new Date(instant.getTime() - instant.getTimezoneOffset() * 60_000);
    expect(localNowValue()).toBe(local.toISOString().slice(0, 16));
  });
});
