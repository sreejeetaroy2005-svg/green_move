const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const authRoutes = require('../routes/auth');
const tripsRoutes = require('../routes/trips');
const whatsappRoutes = require('../routes/whatsapp');
const rewardsRoutes = require('../routes/rewards');
const analyticsRoutes = require('../routes/analytics');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Fallback logic for serving frontend files manually if needed
app.get('/dashboard', (req, res) => {
  // We'll let the frontend JS handle routing or just serve index.html
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Init DB and Start Server
getDb().then(() => {
  console.log('SQLite Database Initialized');
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database', err);
});
