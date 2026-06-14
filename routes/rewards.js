const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getDb } = require('../src/db');
const { genId } = require('../src/helpers');

const router = express.Router();

router.get('/my', authenticateToken, requireRole('commuter'), async (req, res) => {
  try {
    const db = await getDb();
    const commuter = await db.get('SELECT * FROM commuters WHERE id = ?', [req.user.id]);
    const history = await db.all('SELECT * FROM rewards WHERE commuter_id = ? ORDER BY redeemed_at DESC', [req.user.id]);
    res.json({ current_points: commuter.total_points, badge: commuter.badge, history });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/redeem', authenticateToken, requireRole('commuter'), async (req, res) => {
  try {
    const { reward_type, points_spent } = req.body;
    const db = await getDb();
    const commuter = await db.get('SELECT * FROM commuters WHERE id = ?', [req.user.id]);
    
    if (commuter.total_points < points_spent) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    const newPoints = commuter.total_points - points_spent;
    await db.run('UPDATE commuters SET total_points = ? WHERE id = ?', [newPoints, commuter.id]);

    const reward_id = genId('rew');
    await db.run(
      'INSERT INTO rewards (id, commuter_id, points_spent, reward_type, employer_id) VALUES (?, ?, ?, ?, ?)',
      [reward_id, commuter.id, points_spent, reward_type, commuter.employer_id]
    );

    res.json({ message: 'Reward redeemed successfully', new_balance: newPoints, reward_id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/badges', (req, res) => {
  res.json([
    { name: '🌱 Green Starter', condition: 'First trip logged' },
    { name: '🚴 Cycle Hero', condition: '10 cycle trips' },
    { name: '🌍 Carbon Saver', condition: '10kg CO2 saved' },
    { name: '⚡ Streak Master', condition: '7-day streak' },
    { name: '🏆 Green Champion', condition: '50kg CO2 saved' }
  ]);
});

module.exports = router;
