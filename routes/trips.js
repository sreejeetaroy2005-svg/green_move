const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getDb } = require('../src/db');
const { calcCarbonKg } = require('../src/carbon-engine');
const { genId, generateTxHash, calculatePoints, assignBadge } = require('../src/helpers');

const router = express.Router();

router.post('/', authenticateToken, requireRole('commuter'), async (req, res) => {
  try {
    const { mode, distance_km, city } = req.body;
    const commuter_id = req.user.id; // from token payload

    if (!mode || !distance_km) {
      return res.status(400).json({ error: 'Mode and distance_km are required' });
    }

    const db = await getDb();
    const { co2_saved_kg } = calcCarbonKg(mode, distance_km);
    
    // Fetch current commuter stats for streak and points calculation
    const commuter = await db.get('SELECT * FROM commuters WHERE id = ?', [commuter_id]);
    
    // Simplistic streak logic: just incrementing for now (a real app would check dates)
    const newStreak = commuter.current_streak + 1;
    const points_earned = calculatePoints(co2_saved_kg, mode, newStreak);
    
    const trip_id = genId('trip');
    const tx_hash = generateTxHash({ trip_id, commuter_id, mode, distance_km, co2_saved_kg });
    const tripCity = city || commuter.city;

    // Log trip
    await db.run(
      `INSERT INTO trips (id, commuter_id, mode, distance_km, co2_saved_kg, points_earned, tx_hash, city)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [trip_id, commuter_id, mode, distance_km, co2_saved_kg, points_earned, tx_hash, tripCity]
    );

    // Update transactions table (blockchain mock)
    const tx_id = genId('tx');
    await db.run(
      'INSERT INTO transactions (id, hash, trip_id) VALUES (?, ?, ?)',
      [tx_id, tx_hash, trip_id]
    );

    // Update commuter stats
    const newTotalCo2 = commuter.total_co2_saved_kg + co2_saved_kg;
    const newTotalPoints = commuter.total_points + points_earned;
    // Check trips count for badge
    const { count } = await db.get('SELECT COUNT(*) as count FROM trips WHERE commuter_id = ?', [commuter_id]);
    const newBadge = assignBadge(newTotalCo2, count, newStreak);

    await db.run(
      `UPDATE commuters 
       SET total_co2_saved_kg = ?, total_points = ?, current_streak = ?, badge = ?
       WHERE id = ?`,
      [newTotalCo2, newTotalPoints, newStreak, newBadge, commuter_id]
    );

    res.status(201).json({
      message: 'Trip logged successfully',
      trip_id,
      co2_saved_kg,
      points_earned,
      tx_hash,
      badge: newBadge !== commuter.badge ? newBadge : undefined
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my', authenticateToken, requireRole('commuter'), async (req, res) => {
  try {
    const db = await getDb();
    const trips = await db.all('SELECT * FROM trips WHERE commuter_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(trips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const db = await getDb();
    // Top 5 commuters by co2 saved
    const leaders = await db.all(`
      SELECT c.id, u.name, c.total_co2_saved_kg, c.total_points, c.badge, c.city
      FROM commuters c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.total_co2_saved_kg DESC
      LIMIT 5
    `);
    res.json(leaders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const trip = await db.get('SELECT * FROM trips WHERE id = ?', [req.params.id]);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
