// GreenMove — db.js — refined for Round 2
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const logger = require('./logger');

let dbInstance = null;

async function getDb() {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: path.join(__dirname, '..', 'greenmove.sqlite'),
    driver: sqlite3.Database
  });

  await initSchema(dbInstance);
  return dbInstance;
}

async function initSchema(db) {
  logger.info('Initializing database schema (Round 2 Refined)...');
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      hash TEXT,
      trip_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      commuter_id TEXT,
      mode TEXT,
      distance_km REAL,
      co2_saved_kg REAL,
      points_earned INTEGER,
      tx_hash TEXT,
      city TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS commuters (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      employer_id TEXT,
      city TEXT,
      preferred_mode TEXT,
      total_co2_saved_kg REAL,
      total_points INTEGER,
      current_streak INTEGER,
      badge TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      commuter_id TEXT,
      points_spent INTEGER,
      reward_type TEXT,
      redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      employer_id TEXT
    );

    CREATE TABLE IF NOT EXISTS employers (
      id TEXT PRIMARY KEY,
      name TEXT,
      city TEXT,
      points_to_perk_ratio INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS carbon_log (
      date TEXT,
      city TEXT,
      total_co2_kg REAL,
      total_trips INTEGER,
      modal_share_json TEXT,
      PRIMARY KEY (date, city)
    );

    CREATE TABLE IF NOT EXISTS point_transactions (
      id TEXT PRIMARY KEY,
      commuter_id TEXT,
      amount INTEGER,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_trips_commuter_id ON trips(commuter_id);
    CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);
    CREATE INDEX IF NOT EXISTS idx_commuters_employer_id ON commuters(employer_id);
  `);
}

module.exports = { getDb };
