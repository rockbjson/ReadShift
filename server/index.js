const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const eventRoutes = require('./routes/events');
const sessionRoutes = require('./routes/sessions');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sessions', sessionRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'ReadShift API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});