import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { ClickCounter } from './ClickCounter';

test('shows the loading state', () => {
  render(<ClickCounter label="Global Clicks:" loading className="counter-box" />);

  const element = screen.getByText('Loading counts...');
  expect(element).toBeInTheDocument();
  expect(element).toHaveClass('view-counter', 'loading', 'counter-box');
});

test('shows the unavailable state on error', () => {
  render(<ClickCounter label="Global Clicks:" error="HTTP Error 500" className="counter-box" />);

  const element = screen.getByText('Unavailable');
  expect(element).toBeInTheDocument();
  expect(element).toHaveClass('view-counter', 'error', 'counter-box');
});

test('renders the label and the formatted count as separate pill segments', () => {
  const { container } = render(
    <ClickCounter count={1234} label="Clicks" className="counter-box" />,
  );

  const box = container.firstChild;
  expect(box).toHaveClass('counter-box');
  expect(box.childNodes).toHaveLength(2);
  expect(screen.getByText('Clicks')).toHaveClass('counter-label');
  expect(screen.getByText('1,234')).toHaveClass('counter-value');
});
