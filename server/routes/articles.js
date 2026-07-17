const express = require('express');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Import article from URL
router.post('/import', authenticateToken, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Fetch the article HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return res.status(400).json({ error: 'Could not fetch article' });
    }

    const html = await response.text();

    // Parse with Readability
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return res.status(400).json({ error: 'Could not parse article content' });
    }

    // Split content into paragraphs
    const paragraphDom = new JSDOM(article.content);
    const rawParagraphs = paragraphDom.window.document.querySelectorAll('p');

    const paragraphs = Array.from(rawParagraphs)
      .map((p, index) => ({
        id: `p-${index}`,
        text: p.textContent.trim(),
        index
      }))
      .filter(p => p.text.length > 20); // filter out empty or very short paragraphs

    // Save to database
    const result = await pool.query(
      `INSERT INTO articles (user_id, url, title, content, paragraphs)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, url, created_at`,
      [
        req.user.userId,
        url,
        article.title,
        article.textContent,
        JSON.stringify(paragraphs)
      ]
    );

    const savedArticle = result.rows[0];

    res.status(201).json({
      article: {
        ...savedArticle,
        paragraphs,
        estimatedReadTime: Math.ceil(article.textContent.split(' ').length / 200)
      }
    });

  } catch (err) {
    console.error('Article import error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all articles for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, url, created_at,
        (SELECT completed FROM reading_sessions 
         WHERE article_id = articles.id 
         AND user_id = $1 
         ORDER BY started_at DESC LIMIT 1) as completed
       FROM articles 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.userId]
    );

    res.json({ articles: result.rows });

  } catch (err) {
    console.error('Get articles error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single article
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM articles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ article: result.rows[0] });

  } catch (err) {
    console.error('Get article error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;