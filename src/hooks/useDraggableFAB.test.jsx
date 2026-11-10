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
