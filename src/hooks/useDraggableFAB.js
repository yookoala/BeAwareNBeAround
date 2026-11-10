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
    originX: 0,
    originY: 0,
    baseX: 0,
    baseY: 0,
    lastX: 0,
    lastY: 0,
  });

  useEffect(() => {
    const fab = ref.current;
    function setTranslate(x, y) {
      const nav = document.querySelector('.bottom-nav');
      const navHeight = nav?.getBoundingClientRect().height || 0;
      const width = fab.offsetWidth || 56;
      const height = fab.offsetHeight || 56;
      const maxX = Math.max(0, window.innerWidth - width);
      const maxY = Math.max(0, window.innerHeight - navHeight - height);
      const s = drag.current;
      s.x = Math.min(maxX, Math.max(0, x));
      s.y = Math.min(maxY, Math.max(0, y));
      fab.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
    }

    const start = computeFABStart(window.innerWidth, window.innerHeight);
    setTranslate(start.x, start.y);

    function onResize() {
      const s = drag.current;
      setTranslate(s.x, s.y);
      if (s.dragging) {
        s.baseX = s.x;
        s.baseY = s.y;
        s.startX = s.lastX;
        s.startY = s.lastY;
      }
    }

    function onPointerDown(e) {
      if (!fab.contains(e.target)) return;
      const s = drag.current;
      s.dragging = true;
      s.moved = false;
      s.startX = e.clientX;
      s.startY = e.clientY;
      s.originX = e.clientX;
      s.originY = e.clientY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.baseX = s.x;
      s.baseY = s.y;
    }

    function onPointerMove(e) {
      const s = drag.current;
      if (!s.dragging) return;
      e.preventDefault();
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      if (Math.hypot(e.clientX - s.originX, e.clientY - s.originY) > 5) {
        s.moved = true;
      }
      setTranslate(s.baseX + (e.clientX - s.startX), s.baseY + (e.clientY - s.startY));
    }

    function onPointerUp() {
      drag.current.dragging = false;
    }

    fab.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('resize', onResize);
    return () => {
      fab.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', onResize);
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
