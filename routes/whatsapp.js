// GreenMove — routes/whatsapp.js — refined for Round 2
const express = require('express');
const { getDb } = require('../src/db');
const { calcCarbonKg } = require('../src/carbon-engine');
const { genId, generateTxHash, calculatePoints, assignBadge, calculateNewStreak } = require('../src/helpers');
const logger = require('../src/logger');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { body, commuter_id } = req.body;

    if (!body || !commuter_id) {
      return res.status(400).json({ success: false, error: 'Missing body or commuter_id' });
    }

    const text = body.toLowerCase();
    const db = await getDb();
    
    // Validate commuter
    const commuter = await db.get('SELECT * FROM commuters WHERE id = ? AND is_active = 1', [commuter_id]);
    if (!commuter) return res.status(404).json({ success: false, error: 'User not found.' });

    // --- COMMAND: HELP ---
    if (text === 'help' || text === 'hi' || text === 'hello') {
      const reply = `🌿 *GreenMove Help*nnTo log a trip, tell me your mode and distance:n- "cycled 8km"n- "I took the bus for 12 km"n- "walked 2km to work"nnOther commands:n- *my stats*: View your points & CO2n- *leaderboard*: View top 3 in your company`;
      return res.json({ success: true, data: { reply } });
    }

    // --- COMMAND: MY STATS ---
    if (text.includes('stats') || text.includes('score')) {
      const reply = `📊 *Your Green Stats*nn🌱 Points: ${commuter.total_points}n🌍 CO2 Saved: ${commuter.total_co2_saved_kg}kgn🔥 Streak: ${commuter.current_streak} daysn🏅 Badge: ${commuter.badge}`;
      return res.json({ success: true, data: { reply } });
    }

    // --- COMMAND: LEADERBOARD ---
    if (text.includes('leaderboard')) {
      const leaders = await db.all(`
        SELECT u.name, c.total_co2_saved_kg 
        FROM commuters c JOIN users u ON c.user_id = u.id 
        WHERE c.employer_id = ? AND c.is_active = 1
        ORDER BY c.total_co2_saved_kg DESC LIMIT 3
      `, [commuter.employer_id]);
      
      let reply = '🏆 *Top 3 Commuters in your Company*n';
      leaders.forEach((l, i) => reply += `${i+1}. ${l.name} - ${l.total_co2_saved_kg}kgn`);
      return res.json({ success: true, data: { reply } });
    }

    // --- NLP TRIP PARSING ---
    let mode = null;
    if (/cycl|bike/.test(text)) mode = 'cycle';
    else if (/bus/.test(text)) mode = 'bus';
    else if (/walk|foot/.test(text)) mode = 'walk';
    else if (/metro|train/.test(text)) mode = 'metro';
    else if (/carpool/.test(text)) mode = 'carpool';

    // Match distance: "8km", "12 kilometers", "5.5 kms"
    const distanceMatch = text.match(/(\d+(\.\d+)?)\s*(km|kilometer|kilometers|kms)/);
    
    if (!mode || !distanceMatch) {
      return res.json({ success: true, data: { reply: "Sorry, I didn't understand that. Try: 'cycled 8km' or 'bus 12km'. Send 'help' for more options." } });
    }

    const distance_km = parseFloat(distanceMatch[1]);
    
    // --- PROCESS TRIP ---
    const lastTrip = await db.get('SELECT created_at FROM trips WHERE commuter_id = ? ORDER BY created_at DESC LIMIT 1', [commuter_id]);
    const newStreak = calculateNewStreak(lastTrip ? lastTrip.created_at : null, commuter.current_streak);
    
    const { co2_saved_kg, equivalents } = calcCarbonKg(mode, distance_km);
    const points_earned = calculatePoints(co2_saved_kg, mode, newStreak);
    
    const trip_id = genId('trip');
    const tx_hash = generateTxHash({ trip_id, commuter_id, mode, distance_km, co2_saved_kg });

    await db.run(
      `INSERT INTO trips (id, commuter_id, mode, distance_km, co2_saved_kg, points_earned, tx_hash, city)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [trip_id, commuter_id, mode, distance_km, co2_saved_kg, points_earned, tx_hash, commuter.city]
    );

    const tx_id = genId('tx');
    await db.run('INSERT INTO transactions (id, hash, trip_id) VALUES (?, ?, ?)', [tx_id, tx_hash, trip_id]);

    const newTotalCo2 = parseFloat((commuter.total_co2_saved_kg + co2_saved_kg).toFixed(3));
    const newTotalPoints = commuter.total_points + points_earned;
    const newBadge = assignBadge(newTotalCo2);

    await db.run(
      `UPDATE commuters 
       SET total_co2_saved_kg = ?, total_points = ?, current_streak = ?, badge = ?
       WHERE id = ?`,
      [newTotalCo2, newTotalPoints, newStreak, newBadge, commuter_id]
    );

    await db.run('INSERT INTO point_transactions (id, commuter_id, amount, reason) VALUES (?, ?, ?, ?)', 
      [genId('ptx'), commuter_id, points_earned, `Logged trip via Bot: ${mode}`]);

    const shortHash = tx_hash.substring(0, 8) + '...';
    let reply = `✅ Trip Logged!nMode: ${mode}nDistance: ${distance_km}kmn🌍 CO2 Saved: ${co2_saved_kg}kgn⭐ Points Earned: ${points_earned}nnThat's equivalent to recycling ${equivalents.plastic_bottles_recycled} plastic bottles! ♻️nnTotal Points: ${newTotalPoints}nTx: ${shortHash}`;

    logger.info(`Bot logged trip for commuter ${commuter_id} (${mode} ${distance_km}km)`);
    res.json({ success: true, data: { reply, tx_hash } });
  } catch (err) {
    logger.error('WhatsApp Bot Error', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
