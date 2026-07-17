import { useEffect, useRef } from 'react';

export function useParagraphTracker(onDwell) {
  const timers = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.dataset.paragraphId;

          if (entry.isIntersecting) {
            timers.current[id] = Date.now();
          } else {
            if (timers.current[id]) {
              const dwell = (Date.now() - timers.current[id]) / 1000;
              onDwell(id, dwell);
              delete timers.current[id];
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const paragraphs = document.querySelectorAll('[data-paragraph-id]');
    paragraphs.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [onDwell]);
}