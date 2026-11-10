import { useEffect } from 'react';

// Each prototype page's CSS is scoped under a body class (see page CSS files)
// because the prototype pages define conflicting :root variables, body, *,
// .header, and .app-container rules. The page sets its class on mount.
export default function usePageBodyClass(className) {
  useEffect(() => {
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [className]);
}
