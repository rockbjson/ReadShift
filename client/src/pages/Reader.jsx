import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [showReflection, setShowReflection] = useState(false);
  const [postRating, setPostRating] = useState(null);
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const lastParagraphRef = useRef(null);

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

  // Watch for last paragraph entering viewport
  useEffect(() => {
    if (!lastParagraphRef.current || !sessionId) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShowReflection(true);
        }
      },
      { threshold: 0.8 }
    );

    observer.observe(lastParagraphRef.current);
    return () => observer.disconnect();
  }, [lastParagraphRef.current, sessionId]);

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

      if (sharpnessScore <= 2) {
        setReadingState('focused');
      }
    } catch (err) {
      console.error('Session start error:', err);
    }
  };

  // Submit post-read reflection
  const submitReflection = async (rating) => {
    setPostRating(rating);
    setReflectionSubmitted(true);

    try {
      await api.patch(`/sessions/${sessionId}/end`, {
        post_rating: rating,
        completed: true,
      });
    } catch (err) {
      console.error('Reflection submit error:', err);
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

  useParagraphTracker(handleDwell);
  useRereadDetector(handleReread);
  useScrollVelocity(handleVelocity);

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
          {paragraphs.map((para, index) => (
            <p
              key={para.id}
              data-paragraph-id={para.id}
              ref={index === paragraphs.length - 1 ? lastParagraphRef : null}
              className={`text-gray-800 font-serif transition-all duration-300 ${bodySize[readingState]}`}
            >
              {para.text}
            </p>
          ))}
        </div>

        {/* Post-read reflection card */}
        {showReflection && (
          <div className="mt-16 border-t border-gray-200 pt-10">
            {!reflectionSubmitted ? (
              <div className="text-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
                  After you read
                </p>
                <p className="text-lg font-semibold text-gray-900 mb-6">
                  How was that read?
                </p>
                <div className="flex gap-3 justify-center mb-4">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => submitReflection(n)}
                      className="w-12 h-12 border border-gray-200 rounded-lg text-base font-medium text-gray-700 hover:bg-teal-800 hover:text-white hover:border-teal-800 transition-colors"
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between max-w-xs mx-auto mb-8">
                  <span className="text-xs text-gray-400">Poor</span>
                  <span className="text-xs text-gray-400">Excellent</span>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Skip — view insights
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Session saved
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Your reading data has been recorded.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-teal-800 text-white px-6 py-2 rounded text-sm font-medium hover:bg-teal-900"
                  >
                    View insights
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="border border-gray-200 text-gray-600 px-6 py-2 rounded text-sm font-medium hover:border-gray-300"
                  >
                    Back to home
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Reader;