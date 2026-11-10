import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import useDraggableFAB, { computeFABStart } from './useDraggableFAB';

function Harness({ onClick }) {
  const { ref, handleClick } = useDraggableFAB(onClick);
  return <button ref={ref} onClick={handleClick}>record</button>;
}

// jsdom does not implement PointerEvent; MouseEvent provides the pointer coordinates.
function pointer(target, type, x, y) {
  fireEvent(target, new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }));
}

test('starts above the bottom navigation on narrow and short viewports', () => {
  expect(computeFABStart(375, 812)).toEqual({ x: 299, y: 662 });
  expect(computeFABStart(600, 100)).toEqual({ x: 431, y: 80 });
});

test('clicks after a small movement but suppresses clicks after dragging', () => {
  const onClick = vi.fn();
  render(<Harness onClick={onClick} />);
  const fab = screen.getByRole('button');
  pointer(fab, 'pointerdown', 20, 20);
  pointer(document, 'pointermove', 25, 20);
  pointer(document, 'pointerup', 25, 20);
  fireEvent.click(fab);
  expect(onClick).toHaveBeenCalledTimes(1);
  const previous = fab.style.transform;
  pointer(fab, 'pointerdown', 20, 20);
  pointer(document, 'pointermove', 40, 30);
  pointer(document, 'pointerup', 40, 30);
  expect(fab.style.transform).not.toBe(previous);
  fireEvent.click(fab);
  expect(onClick).toHaveBeenCalledTimes(1);
});

test('suppresses navigation after a diagonal drag over five pixels', () => {
  const onClick = vi.fn();
  render(<Harness onClick={onClick} />);
  const fab = screen.getByRole('button');
  pointer(fab, 'pointerdown', 20, 20);
  pointer(document, 'pointermove', 24, 24);
  pointer(document, 'pointerup', 24, 24);
  fireEvent.click(fab);
  expect(onClick).not.toHaveBeenCalled();
});

test('clamps dragging and resize to the viewport above the bottom navigation', () => {
  vi.stubGlobal('innerWidth', 800);
  vi.stubGlobal('innerHeight', 800);
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.getBoundingClientRect = () => ({ height: 80 });
  document.body.appendChild(nav);
  try {
    render(<Harness onClick={vi.fn()} />);
    const fab = screen.getByRole('button');
    Object.defineProperty(fab, 'offsetWidth', { value: 56 });
    Object.defineProperty(fab, 'offsetHeight', { value: 56 });
    pointer(fab, 'pointerdown', 0, 0);
    pointer(document, 'pointermove', 2000, 2000);
    pointer(document, 'pointerup', 2000, 2000);
    expect(fab.style.transform).toBe('translate3d(744px, 664px, 0)');
    vi.stubGlobal('innerWidth', 320);
    vi.stubGlobal('innerHeight', 480);
    fireEvent(window, new Event('resize'));
    expect(fab.style.transform).toBe('translate3d(264px, 344px, 0)');
    pointer(fab, 'pointerdown', 0, 0);
    pointer(document, 'pointermove', -2000, -2000);
    expect(fab.style.transform).toBe('translate3d(0px, 0px, 0)');
  } finally { nav.remove(); }
});

test('keeps gesture distance from pointer-down across a resize', () => {
  const onClick = vi.fn();
  render(<Harness onClick={onClick} />);
  const fab = screen.getByRole('button');
  pointer(fab, 'pointerdown', 20, 20);
  pointer(document, 'pointermove', 24, 20);
  fireEvent(window, new Event('resize'));
  pointer(document, 'pointermove', 27, 20);
  pointer(document, 'pointerup', 27, 20);
  fireEvent.click(fab);
  expect(onClick).not.toHaveBeenCalled();
});
