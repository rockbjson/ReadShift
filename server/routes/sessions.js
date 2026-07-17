const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Create a new reading session
router.post('/', authenticateToken, async (req, res) => {
  const { article_id, pre_sharpness } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO reading_sessions (user_id, article_id, pre_sharpness)
       VALUES ($1, $2, $3)
       RETURNING id, started_at`,
      [req.user.userId, article_id, pre_sharpness]
    );

    res.status(201).json({ session: result.rows[0] });

  } catch (err) {
    console.error('Create session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// End a reading session
router.patch('/:id/end', authenticateToken, async (req, res) => {
  const { post_rating, completed } = req.body;

  try {
    const result = await pool.query(
      `UPDATE reading_sessions 
       SET ended_at = NOW(), post_rating = $1, completed = $2
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [post_rating, completed, req.params.id, req.user.userId]
    );

    res.json({ session: result.rows[0] });

  } catch (err) {
    console.error('End session error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;