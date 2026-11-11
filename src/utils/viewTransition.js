import { flushSync } from 'react-dom';

/**
 * Navigate between routes using the CSS View Transitions API with a directional
 * class ('vt-slide-in-right' | 'vt-slide-out-right') on <html>. Falls back to
 * immediate navigation when document.startViewTransition is unavailable or
 * when prefers-reduced-motion is enabled. `options` is passed through to
 * react-router's navigate (e.g. { state } for nav-state toasts); `to` may
 * also be a history offset like -1 for "browser back".
 */
export function navigateWithViewTransition(navigate, to, directionClass, options) {
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
    navigate(to, options);
    return;
  }

  root.classList.add(directionClass);
  const transition = document.startViewTransition(() => {
    flushSync(() => {
      navigate(to, options);
    });
  });

  Promise.resolve(transition?.finished)
    .catch(() => {})
    .finally(() => {
      root.classList.remove(directionClass);
    });
}
