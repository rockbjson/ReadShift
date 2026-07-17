const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Batch insert behavioral events
router.post('/batch', authenticateToken, async (req, res) => {
  const { events } = req.body;

  if (!events || events.length === 0) {
    return res.status(400).json({ error: 'No events provided' });
  }

  try {
    const values = events.map((e) => [
      e.session_id,
      e.event_type,
      e.paragraph_id,
      e.value,
      e.timestamp
    ]);

    for (const value of values) {
      await pool.query(
        `INSERT INTO behavioral_events 
         (session_id, event_type, paragraph_id, value, timestamp)
         VALUES ($1, $2, $3, $4, $5)`,
        value
      );
    }

    res.json({ inserted: events.length });

  } catch (err) {
    console.error('Event logging error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;