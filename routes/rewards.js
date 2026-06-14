// GreenMove — routes/rewards.js — refined for Round 2
const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getDb } = require('../src/db');
const { genId, getNextBadge } = require('../src/helpers');
const logger = require('../src/logger');

const router = express.Router();

router.get('/my', authenticateToken, requireRole('commuter'), async (req, res) => {
  try {
    const db = await getDb();
    const commuter = await db.get('SELECT * FROM commuters WHERE id = ? AND is_active = 1', [req.user.id]);
    
    if (!commuter) {
      return res.status(404).json({ success: false, error: 'Commuter profile not found' });
    }

    const history = await db.all('SELECT * FROM rewards WHERE commuter_id = ? ORDER BY redeemed_at DESC', [req.user.id]);
    const pointTransactions = await db.all('SELECT * FROM point_transactions WHERE commuter_id = ? ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    
    const nextBadgeInfo = getNextBadge(commuter.total_co2_saved_kg);

    res.json({
      success: true,
      data: {
        current_points: commuter.total_points,
        total_co2: commuter.total_co2_saved_kg,
        badge: commuter.badge,
        streak: commuter.current_streak,
        next_badge: nextBadgeInfo,
        redemption_history: history,
        transaction_history: pointTransactions
      }
    });
  } catch (err) {
    logger.error('Error fetching rewards', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/redeem', authenticateToken, requireRole('commuter'), async (req, res) => {
  try {
    const { reward_type, points_spent } = req.body;
    
    if (!reward_type || typeof points_spent !== 'number' || points_spent <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid reward_type or points_spent' });
    }

    const db = await getDb();
    const commuter = await db.get('SELECT * FROM commuters WHERE id = ? AND is_active = 1', [req.user.id]);
    
    if (!commuter) return res.status(404).json({ success: false, error: 'Commuter not found' });

    if (commuter.total_points < points_spent) {
      return res.status(400).json({ success: false, error: 'Insufficient points' });
    }

    const newPoints = commuter.total_points - points_spent;
    await db.run('UPDATE commuters SET total_points = ? WHERE id = ?', [newPoints, commuter.id]);

    const reward_id = genId('rew');
    await db.run(
      'INSERT INTO rewards (id, commuter_id, points_spent, reward_type, employer_id) VALUES (?, ?, ?, ?, ?)',
      [reward_id, commuter.id, points_spent, reward_type, commuter.employer_id]
    );

    // Log transaction
    const txId = genId('ptx');
    await db.run(
      'INSERT INTO point_transactions (id, commuter_id, amount, reason) VALUES (?, ?, ?, ?)',
      [txId, commuter.id, -points_spent, `Redeemed: ${reward_type}`]
    );

    logger.info(`Commuter ${commuter.id} redeemed ${points_spent} pts for ${reward_type}`);

    res.json({ 
      success: true, 
      data: { message: 'Reward redeemed successfully', new_balance: newPoints, reward_id } 
    });
  } catch (err) {
    logger.error('Error redeeming reward', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/badges', (req, res) => {
  res.json({
    success: true,
    data: [
      { name: '🌱 Green Starter', threshold: '0.1kg CO2' },
      { name: '🌍 Carbon Saver', threshold: '10kg CO2' },
      { name: '🏆 Green Champion', threshold: '50kg CO2' },
      { name: '💎 Earth Guardian', threshold: '100kg CO2' }
    ]
  });
});

module.exports = router;
