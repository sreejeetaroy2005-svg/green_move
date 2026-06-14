const express = require('express');
const { getDb } = require('../src/db');
const { calcCarbonKg } = require('../src/carbon-engine');
const { genId, generateTxHash, calculatePoints, assignBadge } = require('../src/helpers');

const router = express.Router();

// Mocking WhatsApp webhook endpoint
// In a real app, this would receive a payload from Twilio or WhatsApp Business API
router.post('/', async (req, res) => {
  try {
    // Body from whatsapp: { from: 'whatsapp:+919876543210', body: 'cycled 8km today' }
    // For this prototype, we'll assume the commuter_id is passed directly for simplicity 
    // or we look it up by phone number (but we don't have phone numbers in DB schema).
    // Let's pass commuter_id in body for the demo.
    const { body, commuter_id } = req.body;

    if (!body || !commuter_id) {
      return res.status(400).json({ error: 'Missing body or commuter_id' });
    }

    const text = body.toLowerCase();
    
    // Command: "my score"
    if (text.includes('score')) {
      const db = await getDb();
      const commuter = await db.get('SELECT * FROM commuters WHERE id = ?', [commuter_id]);
      if (!commuter) return res.status(404).json({ reply: 'User not found.' });
      return res.json({ reply: `Your Score: \\n🌱 Points: ${commuter.total_points} \\n🌍 CO2 Saved: ${commuter.total_co2_saved_kg}kg \\n🏅 Badge: ${commuter.badge}` });
    }

    // Command: "leaderboard"
    if (text.includes('leaderboard')) {
      const db = await getDb();
      const leaders = await db.all(`
        SELECT u.name, c.total_co2_saved_kg 
        FROM commuters c JOIN users u ON c.user_id = u.id 
        ORDER BY c.total_co2_saved_kg DESC LIMIT 3
      `);
      let reply = '🏆 *Top 3 Commuters*\\n';
      leaders.forEach((l, i) => reply += `${i+1}. ${l.name} - ${l.total_co2_saved_kg}kg\\n`);
      return res.json({ reply });
    }

    // Parse commute message (e.g. "cycled 8km")
    let mode = 'car';
    if (text.includes('cycle') || text.includes('cycled')) mode = 'cycle';
    else if (text.includes('bus')) mode = 'bus';
    else if (text.includes('walk')) mode = 'walk';
    else if (text.includes('metro')) mode = 'metro';
    else if (text.includes('carpool')) mode = 'carpool';

    const distanceMatch = text.match(/(\d+(\.\d+)?)\s*km/);
    if (!distanceMatch) {
      return res.json({ reply: "I couldn't understand the distance. Please say something like 'cycled 8km today'." });
    }

    const distance_km = parseFloat(distanceMatch[1]);
    
    // Process Trip
    const db = await getDb();
    const { co2_saved_kg } = calcCarbonKg(mode, distance_km);
    const commuter = await db.get('SELECT * FROM commuters WHERE id = ?', [commuter_id]);
    
    const newStreak = commuter.current_streak + 1;
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
    const { count } = await db.get('SELECT COUNT(*) as count FROM trips WHERE commuter_id = ?', [commuter_id]);
    const newBadge = assignBadge(newTotalCo2, count, newStreak);

    await db.run(
      `UPDATE commuters 
       SET total_co2_saved_kg = ?, total_points = ?, current_streak = ?, badge = ?
       WHERE id = ?`,
      [newTotalCo2, newTotalPoints, newStreak, newBadge, commuter_id]
    );

    const shortHash = tx_hash.substring(0, 8) + '...';
    const reply = `✅ Trip Logged!\\nMode: ${mode}\\nDistance: ${distance_km}km\\n🌍 CO2 Saved: ${co2_saved_kg}kg\\n⭐ Points Earned: ${points_earned}\\n\\nTotal Points: ${newTotalPoints}\\nTx: ${shortHash}\\nKeep it up! 🌿`;

    res.json({ reply, tx_hash });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
