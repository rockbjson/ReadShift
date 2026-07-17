const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Average focus score (based on comprehension scores)
    const focusResult = await pool.query(
      `SELECT ROUND(AVG(cs.score)) as avg_score
       FROM comprehension_scores cs
       JOIN reading_sessions rs ON cs.session_id = rs.id
       WHERE rs.user_id = $1`,
      [userId]
    );

    // Sessions last 7 days
    const sessionsResult = await pool.query(
      `SELECT 
         DATE(started_at) as date,
         COUNT(*) as session_count,
         AVG(pre_sharpness) as avg_sharpness
       FROM reading_sessions
       WHERE user_id = $1
         AND started_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(started_at)
       ORDER BY date ASC`,
      [userId]
    );

    // Total articles read
    const articlesResult = await pool.query(
      `SELECT COUNT(DISTINCT article_id) as total
       FROM reading_sessions
       WHERE user_id = $1`,
      [userId]
    );

    // Best reading hour
    const hourResult = await pool.query(
      `SELECT 
         EXTRACT(HOUR FROM started_at) as hour,
         COUNT(*) as session_count
       FROM reading_sessions
       WHERE user_id = $1
       GROUP BY hour
       ORDER BY session_count DESC
       LIMIT 1`,
      [userId]
    );

    // Reread count this week
    const rereadResult = await pool.query(
      `SELECT COUNT(*) as reread_count
       FROM behavioral_events be
       JOIN reading_sessions rs ON be.session_id = rs.id
       WHERE rs.user_id = $1
         AND be.event_type = 'reread'
         AND be.timestamp >= NOW() - INTERVAL '7 days'`,
      [userId]
    );

    res.json({
      avgFocusScore: focusResult.rows[0].avg_score || 0,
      sessionsThisWeek: sessionsResult.rows,
      totalArticles: articlesResult.rows[0].total,
      bestHour: hourResult.rows[0]?.hour || null,
      rereadCount: rereadResult.rows[0].reread_count,
    });

  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get article heatmap data
router.get('/article/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Get all behavioral events for this session
    const eventsResult = await pool.query(
      `SELECT event_type, paragraph_id, value, timestamp
       FROM behavioral_events
       WHERE session_id = $1
       ORDER BY timestamp ASC`,
      [sessionId]
    );

    // Get session details
    const sessionResult = await pool.query(
      `SELECT rs.*, a.title, a.paragraphs
       FROM reading_sessions rs
       JOIN articles a ON rs.article_id = a.id
       WHERE rs.id = $1 AND rs.user_id = $2`,
      [sessionId, req.user.userId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];
    const events = eventsResult.rows;

    // Build paragraph engagement map
    const paragraphs = typeof session.paragraphs === 'string'
      ? JSON.parse(session.paragraphs)
      : session.paragraphs;

    const paragraphData = paragraphs.map((p) => {
      const dwellEvents = events.filter(
        (e) => e.event_type === 'dwell' && e.paragraph_id === p.id
      );
      const rereadEvents = events.filter(
        (e) => e.event_type === 'reread' && e.paragraph_id === p.id
      );

      const totalDwell = dwellEvents.reduce((sum, e) => sum + (e.value || 0), 0);
      const rereadCount = rereadEvents.length;

      let engagement = 'not_reached';
        if (totalDwell > 0) {
        if (rereadCount >= 1) engagement = 'reread';
        else if (totalDwell > 2) engagement = 'normal';
        else engagement = 'skimmed';
        }

      return {
        id: p.id,
        index: p.index,
        text: p.text.substring(0, 100) + '...',
        totalDwell,
        rereadCount,
        engagement,
      };
    });

    res.json({
      session: {
        id: session.id,
        title: session.title,
        started_at: session.started_at,
        pre_sharpness: session.pre_sharpness,
      },
      paragraphData,
      summary: {
        totalParagraphs: paragraphs.length,
        reached: paragraphData.filter((p) => p.engagement !== 'not_reached').length,
        reread: paragraphData.filter((p) => p.engagement === 'reread').length,
        dropOffIndex: paragraphData.findIndex((p) => p.engagement === 'not_reached'),
      },
    });

  } catch (err) {
    console.error('Heatmap error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get recent sessions for a user
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rs.id, rs.started_at, rs.pre_sharpness, rs.completed,
              a.title, a.url
       FROM reading_sessions rs
       JOIN articles a ON rs.article_id = a.id
       WHERE rs.user_id = $1
       ORDER BY rs.started_at DESC
       LIMIT 10`,
      [req.user.userId]
    );

    res.json({ sessions: result.rows });

  } catch (err) {
    console.error('Sessions error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;