import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useParagraphTracker } from '../hooks/useParagraphTracker';
import { useRereadDetector } from '../hooks/useRereadDetector';
import { useScrollVelocity } from '../hooks/useScrollVelocity';
import { useEventLogger } from '../hooks/useEventLogger';

const Reader = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [sharpness, setSharpness] = useState(null);
  const [showCheckIn, setShowCheckIn] = useState(true);
  const [readingState, setReadingState] = useState('default');

  const { log } = useEventLogger(sessionId);

  // Fetch article
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await api.get(`/articles/${id}`);
        setArticle(response.data.article);
      } catch (err) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id, navigate]);

  // Start session after check-in
  const startSession = async (sharpnessScore) => {
    try {
      const response = await api.post('/sessions', {
        article_id: id,
        pre_sharpness: sharpnessScore,
      });
      setSessionId(response.data.session.id);
      setSharpness(sharpnessScore);
      setShowCheckIn(false);

      // Auto-enable focused mode for low sharpness
      if (sharpnessScore <= 2) {
        setReadingState('focused');
      }
    } catch (err) {
      console.error('Session start error:', err);
    }
  };

  // Behavioral tracking callbacks
  const handleDwell = useCallback((paragraphId, dwellTime) => {
    log('dwell', paragraphId, dwellTime);
  }, [log]);

  const handleReread = useCallback((paragraphId) => {
    log('reread', paragraphId, 1);
  }, [log]);

  const handleVelocity = useCallback((type, velocity) => {
    log('velocity', null, velocity);
    if (type === 'fast') setReadingState('skimming');
    else if (type === 'slow' && readingState === 'skimming') setReadingState('default');
  }, [log, readingState]);

  // Activate tracking hooks
  useParagraphTracker(handleDwell);
  useRereadDetector(handleReread);
  useScrollVelocity(handleVelocity);

  // Background and font size per reading state
  const stateStyles = {
    default: 'bg-stone-50',
    focused: 'bg-amber-50',
    skimming: 'bg-white',
  };

  const bodySize = {
    default: 'text-lg leading-relaxed',
    focused: 'text-xl leading-loose',
    skimming: 'text-base leading-snug',
  };

  const columnWidth = {
    default: 'max-w-xl',
    focused: 'max-w-2xl',
    skimming: 'max-w-lg',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading article...</p>
      </div>
    );
  }

  // Pre-read check-in screen
  if (showCheckIn) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-6">
          Before you read
        </p>
        <p className="text-2xl font-semibold text-gray-900 text-center mb-8 max-w-xs leading-snug">
          How sharp are you feeling right now?
        </p>
        <div className="flex gap-3 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => startSession(n)}
              className="w-14 h-14 border border-gray-200 rounded-lg text-lg font-medium text-gray-700 hover:bg-teal-800 hover:text-white hover:border-teal-800 transition-colors"
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between w-full max-w-xs mb-12">
          <span className="text-xs text-gray-400">Not sharp at all</span>
          <span className="text-xs text-gray-400">Very sharp</span>
        </div>
        <button
          onClick={() => startSession(3)}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Skip
        </button>
      </div>
    );
  }

  const paragraphs = typeof article.paragraphs === 'string'
    ? JSON.parse(article.paragraphs)
    : article.paragraphs;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${stateStyles[readingState]}`}>

      {/* Navigation */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          {readingState === 'focused' && (
            <span className="text-xs bg-teal-800 text-white px-3 py-1 rounded-full">
              Focused mode
            </span>
          )}
          {readingState === 'skimming' && (
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              Skimming
            </span>
          )}
        </div>
      </div>

      {/* Article */}
      <div className={`mx-auto px-6 py-10 transition-all duration-300 ${columnWidth[readingState]}`}>

        <h1 className="font-semibold text-gray-900 text-2xl leading-snug mb-3">
          {article.title}
        </h1>

        <p className="text-sm text-gray-400 mb-8">
          {new URL(article.url).hostname.replace('www.', '')}
        </p>

        <div className="flex flex-col gap-6">
          {paragraphs.map((para) => (
            <p
              key={para.id}
              data-paragraph-id={para.id}
              className={`text-gray-800 font-serif transition-all duration-300 ${bodySize[readingState]}`}
            >
              {para.text}
            </p>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Reader;