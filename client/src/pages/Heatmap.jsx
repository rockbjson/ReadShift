import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const engagementColours = {
  reread: 'bg-teal-800',
  normal: 'bg-teal-500',
  skimmed: 'bg-teal-200',
  not_reached: 'bg-gray-100 border border-dashed border-gray-300',
};

const engagementLabels = {
  reread: 'Re-read',
  normal: 'Normal',
  skimmed: 'Skimmed',
  not_reached: 'Not reached',
};

const Heatmap = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedParagraph, setSelectedParagraph] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/insights/article/${sessionId}`);
        setData(response.data);
      } catch (err) {
        console.error('Heatmap error:', err);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading heatmap...</p>
      </div>
    );
  }

  if (!data) return null;

  const { session, paragraphData, summary } = data;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-6 block"
        >
          ← Dashboard
        </button>

        <h1 className="text-lg font-semibold text-gray-900 mb-1 leading-snug">
          {session.title}
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          {new Date(session.started_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
          {session.pre_sharpness && ` · Sharpness ${session.pre_sharpness}/5`}
        </p>

        {/* Summary strip */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex gap-6">
            <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                {Math.round((summary.reached / summary.totalParagraphs) * 100)}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Read</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                {summary.reread}
                </p>
                <p className="text-xs text-gray-400 mt-1">Re-read</p>
            </div>
            <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                {summary.dropOffIndex === -1 ? '—' : `¶${summary.dropOffIndex + 1}`}
                </p>
                <p className="text-xs text-gray-400 mt-1">Drop-off</p>
            </div>
            </div>

        {/* Two column layout */}
        <div className="flex gap-4">

          {/* Left — heatmap strip */}
          <div className="flex flex-col gap-1 w-8 flex-shrink-0">
            {paragraphData.map((para) => (
              <div
                key={para.id}
                className={`w-8 h-5 rounded cursor-pointer transition-opacity hover:opacity-70 ${engagementColours[para.engagement]}`}
                onClick={() => setSelectedParagraph(para)}
                title={`Paragraph ${para.index + 1} — ${engagementLabels[para.engagement]}`}
              />
            ))}
          </div>

          {/* Right — paragraph text or selected detail */}
          <div className="flex-1">
            {selectedParagraph ? (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">
                    Paragraph {selectedParagraph.index + 1}
                  </p>
                  <button
                    onClick={() => setSelectedParagraph(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">
                  {selectedParagraph.text}
                </p>
                <div className="flex gap-4 border-t border-gray-100 pt-3">
                  <div>
                    <p className="text-xs text-gray-400">Engagement</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">
                      {engagementLabels[selectedParagraph.engagement]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Dwell time</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">
                      {selectedParagraph.totalDwell.toFixed(1)}s
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Re-reads</p>
                    <p className="text-sm font-medium text-gray-700 mt-0.5">
                      {selectedParagraph.rereadCount}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {paragraphData.map((para) => (
                  <div
                    key={para.id}
                    className={`p-2 rounded cursor-pointer transition-colors hover:bg-gray-50 ${
                      para.engagement === 'reread' ? 'border-l-2 border-teal-800' : ''
                    }`}
                    onClick={() => setSelectedParagraph(para)}
                  >
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {para.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-6 mt-6 pt-6 border-t border-gray-200">
          {Object.entries(engagementLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${engagementColours[key]}`} />
              <span className="text-xs text-gray-400">{label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Heatmap;