// GreenMove — routes/auth.js — refined for Round 2
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../src/db');
const { genId } = require('../src/helpers');
const { JWT_SECRET } = require('../middleware/auth');
const logger = require('../src/logger');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, employer_id, city, preferred_mode } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const db = await getDb();
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
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
        `INSERT INTO commuters (id, user_id, employer_id, city, preferred_mode, total_co2_saved_kg, total_points, current_streak, badge, is_active) 
         VALUES (?, ?, ?, ?, ?, 0, 0, 0, 'Newbie', 1)`,
        [commuterId, userId, employer_id || null, city || 'Bengaluru', preferred_mode || 'bus']
      );
    } else if (role === 'employer') {
      const empId = employer_id || genId('emp');
      await db.run(
        'INSERT OR IGNORE INTO employers (id, name, city, points_to_perk_ratio) VALUES (?, ?, ?, ?)',
        [empId, name + " Corp", city || 'Bengaluru', 100]
      );
    }

    logger.info(`User registered: ${email} (${role || 'commuter'})`);
    res.status(201).json({ success: true, data: { message: 'User registered successfully', userId } });
  } catch (err) {
    logger.error('Registration error', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Invalid credentials' });
    }

    let extraData = {};
    if (user.role === 'commuter') {
      const commuter = await db.get('SELECT id, employer_id, city FROM commuters WHERE user_id = ? AND is_active = 1', [user.id]);
      if (commuter) extraData = commuter;
      else return res.status(403).json({ success: false, error: 'Commuter profile inactive or missing' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, ...extraData }, JWT_SECRET, { expiresIn: '1d' });
    
    logger.info(`User logged in: ${email}`);
    res.json({ success: true, data: { token, role: user.role, name: user.name, extraData } });
  } catch (err) {
    logger.error('Login error', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
