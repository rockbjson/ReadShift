import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/articles');
      setArticles(response.data.articles);
    } catch (err) {
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setImporting(true);
    setError('');

    try {
      await api.post('/articles/import', { url });
      setUrl('');
      fetchArticles();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import article');
    } finally {
      setImporting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-semibold text-gray-900">ReadShift</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Insights
            </button>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>

        <form onSubmit={handleImport} className="mb-8">
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="+ Paste article URL"
              className="flex-1 border border-gray-200 rounded px-4 py-3 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />
            <button
              type="submit"
              disabled={importing}
              className="bg-teal-800 text-white px-4 py-3 rounded text-sm font-medium hover:bg-teal-900 disabled:opacity-50"
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">
            Saved articles
          </p>

          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : articles.length === 0 ? (
            <p className="text-sm text-gray-400">
              No articles yet — paste a URL above to get started
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 transition-colors"
                  onClick={() => navigate(`/read/${article.id}`)}
                >
                  <p className="text-sm font-medium text-gray-900 mb-1 leading-snug">
                    {article.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new URL(article.url).hostname.replace('www.', '')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;