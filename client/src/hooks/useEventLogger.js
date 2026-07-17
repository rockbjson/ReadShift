import { useRef, useEffect, useCallback } from 'react';
import api from '../api/axios';

export function useEventLogger(sessionId) {
  const queue = useRef([]);

  const log = useCallback((eventType, paragraphId, value) => {
    if (!sessionId) return;
    queue.current.push({
      session_id: sessionId,
      event_type: eventType,
      paragraph_id: paragraphId,
      value,
      timestamp: new Date().toISOString(),
    });
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const flush = setInterval(async () => {
      if (queue.current.length === 0) return;
      const events = [...queue.current];
      queue.current = [];
      try {
        await api.post('/events/batch', { events });
      } catch (err) {
        console.error('Event flush error:', err);
      }
    }, 30000);

    return () => clearInterval(flush);
  }, [sessionId]);

  return { log };
}