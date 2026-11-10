import { useEffect, useRef } from 'react';

// Prototype initDraggableFAB() initial placement: bottom-right of the 414px
// container (anchored to the container edge on wider viewports).
export function computeFABStart(vw, vh) {
  const x = vw > 414 ? vw / 2 + 414 / 2 - 76 : vw - 76;
  return { x, y: Math.max(80, vh - 150) };
}

// Draggable emergency FAB (mouse + touch via pointer events; the CSS sets
// touch-action: none). Drag-vs-click semantics per M08-004: total movement
// ≤5px counts as a click (fires onClick), a larger drag moves the FAB but
// suppresses the click. (The prototype's click guard compared xOffset values
// that drag itself overwrote, so it never actually suppressed post-drag
// clicks; the documented threshold semantics are implemented here instead.)
export default function useDraggableFAB(onClick) {
  const ref = useRef(null);
  const drag = useRef({
    dragging: false,
    moved: false,
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  });

  useEffect(() => {
    const fab = ref.current;
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    const start = computeFABStart(vw, vh);
    drag.current.x = start.x;
    drag.current.y = start.y;
    fab.style.transform = `translate3d(${start.x}px, ${start.y}px, 0)`;

    function setTranslate(x, y) {
      fab.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }

    function onPointerDown(e) {
      if (e.target !== fab) return;
      const s = drag.current;
      s.dragging = true;
      s.moved = false;
      s.startX = e.clientX;
      s.startY = e.clientY;
      s.baseX = s.x;
      s.baseY = s.y;
    }

    function onPointerMove(e) {
      const s = drag.current;
      if (!s.dragging) return;
      e.preventDefault();
      s.x = s.baseX + (e.clientX - s.startX);
      s.y = s.baseY + (e.clientY - s.startY);
      if (Math.abs(e.clientX - s.startX) > 5 || Math.abs(e.clientY - s.startY) > 5) {
        s.moved = true;
      }
      setTranslate(s.x, s.y);
    }

    function onPointerUp() {
      drag.current.dragging = false;
    }

    fab.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    return () => {
      fab.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  function handleClick(e) {
    if (drag.current.moved) {
      drag.current.moved = false;
      e.preventDefault();
      return;
    }
    onClick();
  }

  return { ref, handleClick };
}
