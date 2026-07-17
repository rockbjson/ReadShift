import { useEffect, useRef } from 'react';

export function useRereadDetector(onReread) {
  const lastScrollY = useRef(0);
  const visitedParagraphs = useRef(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const scrollingUp = currentY < lastScrollY.current;

      if (scrollingUp) {
        const paragraphs = document.querySelectorAll('[data-paragraph-id]');
        paragraphs.forEach((p) => {
          const rect = p.getBoundingClientRect();
          const id = p.dataset.paragraphId;
          if (rect.top > 0 && rect.top < window.innerHeight * 0.5) {
            if (visitedParagraphs.current.has(id)) {
              onReread(id);
            }
          }
        });
      } else {
        document.querySelectorAll('[data-paragraph-id]').forEach((p) => {
          const rect = p.getBoundingClientRect();
          if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
            visitedParagraphs.current.add(p.dataset.paragraphId);
          }
        });
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onReread]);
}