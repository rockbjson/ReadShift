import { useRef, useEffect, useCallback } from 'react';
import api from '../api/axios';

export function useEventLogger(sessionId) {
  const queue = useRef([]);

  const flush = useCallback(async () => {
    if (queue.current.length === 0) return;
    const events = [...queue.current];
    queue.current = [];
    try {
      await api.post('/events/batch', { events });
    } catch (err) {
      console.error('Event flush error:', err);
    }
  }, []);

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

    // Flush every 30 seconds
    const interval = setInterval(flush, 30000);

    // Also flush when user leaves the page
    const handleBeforeUnload = () => flush();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      flush(); // flush on unmount
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, flush]);

  return { log };
}