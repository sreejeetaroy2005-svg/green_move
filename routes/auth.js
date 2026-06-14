const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../src/db');
const { genId } = require('../src/helpers');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, employer_id, city, preferred_mode } = req.body;
    const db = await getDb();

    // Check existing
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = genId('user');

    await db.run(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, hashedPassword, role || 'commuter']
    );

    if (role === 'commuter' || !role) {
      const commuterId = genId('com');
      await db.run(
        `INSERT INTO commuters (id, user_id, employer_id, city, preferred_mode, total_co2_saved_kg, total_points, current_streak, badge) 
         VALUES (?, ?, ?, ?, ?, 0, 0, 0, '🌱 Green Starter')`,
        [commuterId, userId, employer_id || null, city || 'Bengaluru', preferred_mode || 'bus']
      );
    } else if (role === 'employer') {
      const empId = employer_id || genId('emp');
      await db.run(
        'INSERT OR IGNORE INTO employers (id, name, city, points_to_perk_ratio) VALUES (?, ?, ?, ?)',
        [empId, name + " Corp", city || 'Bengaluru', 100]
      );
    }

    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = await getDb();

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    let extraData = {};
    if (user.role === 'commuter') {
      const commuter = await db.get('SELECT id, employer_id FROM commuters WHERE user_id = ?', [user.id]);
      if (commuter) extraData = commuter;
    }

    const token = jwt.sign({ id: user.id, role: user.role, ...extraData }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role, name: user.name, extraData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
