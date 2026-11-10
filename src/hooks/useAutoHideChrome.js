import { useEffect, useRef, useState } from 'react';

const DEFAULT_REVEAL_VH_RATIO = 0.05;

export function useAutoHideChrome({ revealVhRatio = DEFAULT_REVEAL_VH_RATIO } = {}) {
  const [hidden, setHidden] = useState(false);
  const metricsRef = useRef({ lastY: 0, peakDownY: 0 });

  useEffect(() => {
    const initialY = Math.max(0, window.scrollY || 0);
    metricsRef.current = { lastY: initialY, peakDownY: initialY };

    const handleScroll = () => {
      const currentY = Math.max(0, window.scrollY || 0);
      const { lastY, peakDownY } = metricsRef.current;

      if (currentY <= 0) {
        metricsRef.current = { lastY: 0, peakDownY: 0 };
        setHidden(false);
        return;
      }

      if (currentY > lastY) {
        metricsRef.current = { lastY: currentY, peakDownY: currentY };
        setHidden(true);
        return;
      }

      if (currentY < lastY) {
        const threshold = (window.innerHeight || 0) * revealVhRatio;
        if (peakDownY - currentY >= threshold) {
          metricsRef.current = { lastY: currentY, peakDownY: currentY };
          setHidden(false);
        } else {
          metricsRef.current = { lastY: currentY, peakDownY };
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [revealVhRatio]);

  return hidden;
}
