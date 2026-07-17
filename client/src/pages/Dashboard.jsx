import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, sessionsRes] = await Promise.all([
          api.get('/insights/overview'),
          api.get('/insights/sessions'),
        ]);
        setOverview(overviewRes.data);
        setSessions(sessionsRes.data.sessions);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatHour = (hour) => {
    if (hour === null) return 'Not enough data yet';
    const h = parseInt(hour);
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading insights...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900">Insights</h1>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Home
          </button>
        </div>

        {/* Focus score card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
          <div className="flex items-end gap-4">
            <div>
              <p className="text-5xl font-semibold text-gray-900">
                {overview?.avgFocusScore || '—'}
              </p>
              <p className="text-sm text-gray-400 mt-1">Average focus score</p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm text-gray-500">
                {overview?.totalArticles || 0} articles read
              </p>
            </div>
          </div>
        </div>

        {/* Insight cards */}
        <div className="flex flex-col gap-3 mb-8">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
            Insights
          </p>

          {overview?.bestHour !== null && (
            <div className="bg-stone-100 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                You tend to read most around{' '}
                <span className="font-medium">{formatHour(overview.bestHour)}</span>
                {' '}— consider scheduling your most important reads then.
              </p>
            </div>
          )}

          {overview?.rereadCount > 0 && (
            <div className="bg-stone-100 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                You re-read paragraphs{' '}
                <span className="font-medium">{overview.rereadCount} times</span>
                {' '}this week — this often signals dense content or low alertness.
              </p>
            </div>
          )}

          {sessions.length > 0 && (
            <div className="bg-stone-100 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                You have completed{' '}
                <span className="font-medium">
                  {sessions.filter((s) => s.completed).length}
                </span>{' '}
                of your last {sessions.length} reading sessions.
              </p>
            </div>
          )}
        </div>

        {/* Recent sessions */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
            Recent sessions
          </p>

          {sessions.length === 0 ? (
            <p className="text-sm text-gray-400">
              No sessions yet — start reading to see your patterns
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 transition-colors"
                  onClick={() => navigate(`/heatmap/${session.id}`)}
                >
                  <p className="text-sm font-medium text-gray-900 mb-1 leading-snug">
                    {session.title}
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-gray-400">
                      {new Date(session.started_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {session.pre_sharpness && (
                      <p className="text-xs text-gray-400">
                        Sharpness: {session.pre_sharpness}/5
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;