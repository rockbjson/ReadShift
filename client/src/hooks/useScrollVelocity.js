import { useEffect, useRef } from 'react';

export function useScrollVelocity(onVelocityChange) {
  const lastY = useRef(0);
  const lastTime = useRef(Date.now());

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      const deltaY = Math.abs(window.scrollY - lastY.current);
      const deltaT = now - lastTime.current;
      const velocity = deltaT > 0 ? deltaY / deltaT : 0;

      if (velocity > 2) onVelocityChange('fast', velocity);
      else if (velocity < 0.3) onVelocityChange('slow', velocity);
      else onVelocityChange('normal', velocity);

      lastY.current = window.scrollY;
      lastTime.current = now;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onVelocityChange]);
}