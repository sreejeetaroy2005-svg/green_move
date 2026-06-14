const express = require('express');
const { getDb } = require('../src/db');

const router = express.Router();

router.get('/city', async (req, res) => {
  try {
    const db = await getDb();
    
    const stats = await db.get(`
      SELECT 
        SUM(co2_saved_kg) as total_co2,
        COUNT(id) as total_trips,
        COUNT(DISTINCT commuter_id) as active_commuters
      FROM trips
    `);

    const modalShareRaw = await db.all(`
      SELECT mode, COUNT(id) as count 
      FROM trips GROUP BY mode
    `);
    
    const modalShare = modalShareRaw.reduce((acc, row) => ({...acc, [row.mode]: row.count}), {});

    // Top employers
    const topEmployers = await db.all(`
      SELECT e.name, SUM(t.co2_saved_kg) as total_co2
      FROM trips t
      JOIN commuters c ON t.commuter_id = c.id
      JOIN employers e ON c.employer_id = e.id
      GROUP BY e.id
      ORDER BY total_co2 DESC
      LIMIT 10
    `);

    res.json({
      total_co2: stats.total_co2 || 0,
      total_trips: stats.total_trips || 0,
      active_commuters: stats.active_commuters || 0,
      modal_share: modalShare,
      top_employers: topEmployers
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/employer/:id', async (req, res) => {
  try {
    const db = await getDb();
    const employer_id = req.params.id;

    const stats = await db.get(`
      SELECT 
        SUM(t.co2_saved_kg) as total_co2,
        COUNT(t.id) as total_trips,
        COUNT(DISTINCT t.commuter_id) as active_commuters
      FROM trips t
      JOIN commuters c ON t.commuter_id = c.id
      WHERE c.employer_id = ?
    `, [employer_id]);

    const modalShareRaw = await db.all(`
      SELECT t.mode, COUNT(t.id) as count 
      FROM trips t
      JOIN commuters c ON t.commuter_id = c.id
      WHERE c.employer_id = ?
      GROUP BY t.mode
    `, [employer_id]);

    const modalShare = modalShareRaw.reduce((acc, row) => ({...acc, [row.mode]: row.count}), {});

    const team_leaderboard = await db.all(`
      SELECT u.name, t.mode, SUM(t.co2_saved_kg) as total_co2, SUM(t.points_earned) as total_points, c.badge
      FROM trips t
      JOIN commuters c ON t.commuter_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE c.employer_id = ?
      GROUP BY t.commuter_id
      ORDER BY total_co2 DESC
    `, [employer_id]);

    const verified_trips = await db.all(`
      SELECT u.name, t.mode, t.distance_km, t.co2_saved_kg, t.tx_hash, t.created_at
      FROM trips t
      JOIN commuters c ON t.commuter_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE c.employer_id = ?
      ORDER BY t.created_at DESC
    `, [employer_id]);

    res.json({
      total_co2: stats.total_co2 || 0,
      total_trips: stats.total_trips || 0,
      active_commuters: stats.active_commuters || 0,
      modal_share: modalShare,
      team_leaderboard,
      verified_trips
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/trends', async (req, res) => {
  try {
    const db = await getDb();
    // Simplified 30-day trend mock (just returning counts per day)
    const trends = await db.all(`
      SELECT date(created_at) as day, SUM(co2_saved_kg) as co2
      FROM trips
      GROUP BY day
      ORDER BY day ASC
      LIMIT 30
    `);
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
