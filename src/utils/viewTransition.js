import { flushSync } from 'react-dom';

/**
 * Navigate between routes using the CSS View Transitions API with a directional
 * class ('vt-slide-in-right' | 'vt-slide-out-right') on <html>. Falls back to
 * immediate navigation when document.startViewTransition is unavailable or
 * when prefers-reduced-motion is enabled.
 */
export function navigateWithViewTransition(navigate, to, directionClass) {
  const root = typeof document !== 'undefined' ? document.documentElement : null;
  const reducedMotion =
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (
    !root
    || reducedMotion
    || typeof document.startViewTransition !== 'function'
  ) {
    navigate(to);
    return;
  }

  root.classList.add(directionClass);
  const transition = document.startViewTransition(() => {
    flushSync(() => {
      navigate(to);
    });
  });

  Promise.resolve(transition?.finished)
    .catch(() => {})
    .finally(() => {
      root.classList.remove(directionClass);
    });
}
