// GreenMove — routes/analytics.js — refined for Round 2
const express = require('express');
const { getDb } = require('../src/db');
const logger = require('../src/logger');

const router = express.Router();

router.get('/city', async (req, res) => {
  try {
    const db = await getDb();
    const cityFilter = req.query.city;
    
    let whereClause = '1=1';
    let params = [];
    if (cityFilter && cityFilter !== 'All') {
      whereClause = 'c.city = ?';
      params.push(cityFilter);
    }

    const stats = await db.get(`
      SELECT 
        SUM(t.co2_saved_kg) as total_co2,
        COUNT(t.id) as total_trips,
        COUNT(DISTINCT t.commuter_id) as active_commuters
      FROM trips t
      JOIN commuters c ON t.commuter_id = c.id
      WHERE ${whereClause}
    `, params);

    const modalShareRaw = await db.all(`
      SELECT t.mode, COUNT(t.id) as count 
      FROM trips t
      JOIN commuters c ON t.commuter_id = c.id
      WHERE ${whereClause}
      GROUP BY t.mode
    `, params);
    
    const modalShare = modalShareRaw.reduce((acc, row) => ({...acc, [row.mode]: row.count}), {});

    const topEmployers = await db.all(`
      SELECT e.name, SUM(t.co2_saved_kg) as total_co2
      FROM trips t
      JOIN commuters c ON t.commuter_id = c.id
      JOIN employers e ON c.employer_id = e.id
      WHERE ${whereClause.replace('c.city', 'e.city')}
      GROUP BY e.id
      ORDER BY total_co2 DESC
      LIMIT 10
    `, params);

    res.json({
      success: true,
      data: {
        total_co2: stats.total_co2 || 0,
        total_trips: stats.total_trips || 0,
        active_commuters: stats.active_commuters || 0,
        modal_share: modalShare,
        top_employers: topEmployers
      }
    });
  } catch (err) {
    logger.error('Analytics city error', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/employer/:id', async (req, res) => {
  try {
    const db = await getDb();
    const employer_id = req.params.id;
    const timeFilter = req.query.timeRange || 'all'; // 'this_week', 'this_month'

    let timeClause = '';
    if (timeFilter === 'this_month') timeClause = "AND t.created_at >= date('now', 'start of month')";
    else if (timeFilter === 'this_week') timeClause = "AND t.created_at >= date('now', '-7 days')";

    const stats = await db.get(`
      SELECT 
        SUM(t.co2_saved_kg) as total_co2,
        COUNT(t.id) as total_trips,
        COUNT(DISTINCT t.commuter_id) as active_commuters
      FROM trips t
      JOIN commuters c ON t.commuter_id = c.id
      WHERE c.employer_id = ? ${timeClause}
    `, [employer_id]);

    const modalShareRaw = await db.all(`
      SELECT t.mode, COUNT(t.id) as count 
      FROM trips t
      JOIN commuters c ON t.commuter_id = c.id
      WHERE c.employer_id = ? ${timeClause}
      GROUP BY t.mode
    `, [employer_id]);

    const modalShare = modalShareRaw.reduce((acc, row) => ({...acc, [row.mode]: row.count}), {});

    const team_leaderboard = await db.all(`
      SELECT u.name, t.mode, SUM(t.co2_saved_kg) as total_co2, SUM(t.points_earned) as total_points, c.badge
      FROM trips t
      JOIN commuters c ON t.commuter_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE c.employer_id = ? ${timeClause}
      GROUP BY t.commuter_id
      ORDER BY total_co2 DESC
    `, [employer_id]);

    const verified_trips = await db.all(`
      SELECT u.name, t.mode, t.distance_km, t.co2_saved_kg, t.tx_hash, t.created_at
      FROM trips t
      JOIN commuters c ON t.commuter_id = c.id
      JOIN users u ON c.user_id = u.id
      WHERE c.employer_id = ? ${timeClause}
      ORDER BY t.created_at DESC
    `, [employer_id]);

    res.json({
      success: true,
      data: {
        total_co2: stats.total_co2 || 0,
        total_trips: stats.total_trips || 0,
        active_commuters: stats.active_commuters || 0,
        modal_share: modalShare,
        team_leaderboard,
        verified_trips
      }
    });
  } catch (err) {
    logger.error('Analytics employer error', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/trends', async (req, res) => {
  try {
    const db = await getDb();
    const period = req.query.period || 'daily'; // daily, weekly, monthly
    
    let dateFormat = "date(created_at)";
    if (period === 'monthly') dateFormat = "strftime('%Y-%m', created_at)";
    // SQLite doesn't have an easy strftime for week, so we'll just stick to daily/monthly for this demo.

    const query = `
      SELECT ${dateFormat} as period_lbl, SUM(co2_saved_kg) as co2
      FROM trips
      GROUP BY period_lbl
      ORDER BY period_lbl ASC
      LIMIT 30
    `;
    const trends = await db.all(query);
    
    res.json({ success: true, data: trends });
  } catch (err) {
    logger.error('Analytics trends error', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
