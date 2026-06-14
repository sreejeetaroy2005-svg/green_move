// GreenMove — routes/trips.js — refined for Round 2
const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getDb } = require('../src/db');
const { calcCarbonKg } = require('../src/carbon-engine');
const { genId, generateTxHash, calculatePoints, assignBadge, calculateNewStreak } = require('../src/helpers');
const logger = require('../src/logger');

const router = express.Router();

// Specific rate limiting for trips logging (10 per day)
const tripLoggingLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, 
  message: { success: false, error: 'Daily trip logging limit reached (Max 10).' }
});

router.post('/', authenticateToken, requireRole('commuter'), tripLoggingLimiter, async (req, res) => {
  try {
    const { mode, distance_km, city } = req.body;
    const commuter_id = req.user.id; 

    // Input validation
    if (!mode || typeof distance_km !== 'number' || distance_km <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid mode or distance_km' });
    }

    const validModes = ['walk', 'cycle', 'bus', 'metro', 'carpool'];
    if (!validModes.includes(mode.toLowerCase())) {
      return res.status(400).json({ success: false, error: `Unsupported mode: ${mode}` });
    }

    const db = await getDb();
    
    // Check active status
    const commuter = await db.get('SELECT * FROM commuters WHERE id = ? AND is_active = 1', [commuter_id]);
    if (!commuter) {
      return res.status(404).json({ success: false, error: 'Commuter account not active or found.' });
    }

    // Get last trip date to calculate streak accurately
    const lastTrip = await db.get('SELECT created_at FROM trips WHERE commuter_id = ? ORDER BY created_at DESC LIMIT 1', [commuter_id]);
    const newStreak = calculateNewStreak(lastTrip ? lastTrip.created_at : null, commuter.current_streak);

    const { co2_saved_kg } = calcCarbonKg(mode, distance_km);
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

    // Blockchain tx mock
    const tx_id = genId('tx');
    await db.run(
      'INSERT INTO transactions (id, hash, trip_id) VALUES (?, ?, ?)',
      [tx_id, tx_hash, trip_id]
    );

    // Update commuter stats
    const newTotalCo2 = parseFloat((commuter.total_co2_saved_kg + co2_saved_kg).toFixed(3));
    const newTotalPoints = commuter.total_points + points_earned;
    const newBadge = assignBadge(newTotalCo2); // assign based purely on thresholds now

    await db.run(
      `UPDATE commuters 
       SET total_co2_saved_kg = ?, total_points = ?, current_streak = ?, badge = ?
       WHERE id = ?`,
      [newTotalCo2, newTotalPoints, newStreak, newBadge, commuter_id]
    );

    // Log transaction
    const ptxId = genId('ptx');
    await db.run(
      'INSERT INTO point_transactions (id, commuter_id, amount, reason) VALUES (?, ?, ?, ?)',
      [ptxId, commuter_id, points_earned, `Logged trip: ${mode}`]
    );

    logger.info(`Trip ${trip_id} logged for commuter ${commuter_id} (${co2_saved_kg}kg saved)`);

    res.status(201).json({
      success: true,
      data: {
        message: 'Trip logged successfully',
        trip_id,
        co2_saved_kg,
        points_earned,
        tx_hash,
        badge_awarded: newBadge !== commuter.badge ? newBadge : null
      }
    });
  } catch (err) {
    logger.error('Error logging trip', err);
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
});

router.get('/my', authenticateToken, requireRole('commuter'), async (req, res) => {
  try {
    const db = await getDb();
    
    // Pagination params
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const modeFilter = req.query.mode ? req.query.mode.toLowerCase() : null;

    let query = 'SELECT * FROM trips WHERE commuter_id = ?';
    let params = [req.user.id];

    if (modeFilter && modeFilter !== 'all') {
      query += ' AND mode = ?';
      params.push(modeFilter);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const trips = await db.all(query, params);
    res.json({ success: true, data: trips });
  } catch (err) {
    logger.error('Error fetching trips', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const db = await getDb();
    const leaders = await db.all(`
      SELECT c.id, u.name, c.total_co2_saved_kg, c.total_points, c.badge, c.city
      FROM commuters c
      JOIN users u ON c.user_id = u.id
      WHERE c.is_active = 1
      ORDER BY c.total_co2_saved_kg DESC
      LIMIT 5
    `);
    res.json({ success: true, data: leaders });
  } catch (err) {
    logger.error('Error fetching leaderboard', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// CO2 live preview route for frontend form
router.post('/preview', async (req, res) => {
  try {
    const { mode, distance_km } = req.body;
    if (!mode || typeof distance_km !== 'number' || distance_km <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid mode or distance_km' });
    }
    const { co2_saved_kg } = calcCarbonKg(mode, distance_km);
    res.json({ success: true, data: { co2_saved_kg } });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Environmental impact equivalents for a commuter
router.get('/impact', authenticateToken, requireRole('commuter'), async (req, res) => {
  try {
    const db = await getDb();
    const commuter = await db.get('SELECT total_co2_saved_kg FROM commuters WHERE id = ?', [req.user.id]);
    if (!commuter) return res.status(404).json({ success: false, error: 'Commuter not found' });

    const { getEquivalents } = require('../src/carbon-engine');
    const equivalents = getEquivalents(commuter.total_co2_saved_kg);
    res.json({ success: true, data: equivalents });
  } catch (err) {
    logger.error('Error fetching impact', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
