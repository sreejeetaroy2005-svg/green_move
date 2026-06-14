// GreenMove — seed.js — refined for Round 2
const bcrypt = require('bcryptjs');
const { getDb } = require('./db');
const { genId, generateTxHash, calculatePoints, assignBadge, calculateNewStreak } = require('./helpers');
const { calcCarbonKg } = require('./carbon-engine');
const logger = require('./logger');

const CITIES = ['Bengaluru', 'Mumbai', 'Hyderabad'];
const EMPLOYERS = [
  { id: 'emp_1', name: 'Infosys Electronic City', city: 'Bengaluru' },
  { id: 'emp_2', name: 'Wipro Sarjapur', city: 'Bengaluru' },
  { id: 'emp_3', name: 'TCS Whitefield', city: 'Bengaluru' },
  { id: 'emp_4', name: 'Mindtree Bengaluru', city: 'Bengaluru' },
  { id: 'emp_5', name: 'Accenture Hyderabad', city: 'Hyderabad' }
];

const MODES = ['walk', 'cycle', 'bus', 'metro', 'carpool'];

// Generate past 30 dates
const past30Days = [];
for (let i = 30; i >= 0; i--) {
  const d = new Date();
  d.setDate(d.getDate() - i);
  past30Days.push(d);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

async function runSeed() {
  logger.info('Starting Round 2 Data Seed...');
  const db = await getDb();

  // Clear existing data
  await db.exec(`
    DELETE FROM transactions;
    DELETE FROM point_transactions;
    DELETE FROM rewards;
    DELETE FROM trips;
    DELETE FROM commuters;
    DELETE FROM users;
    DELETE FROM employers;
    DELETE FROM carbon_log;
  `);

  // Insert Employers
  for (let emp of EMPLOYERS) {
    await db.run(
      'INSERT INTO employers (id, name, city, points_to_perk_ratio) VALUES (?, ?, ?, ?)',
      [emp.id, emp.name, emp.city, 100]
    );
  }

  // Insert 1 City Planner
  const plannerId = genId('user');
  const hash = await bcrypt.hash('password123', 10);
  await db.run('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', 
    [plannerId, 'City Planner', 'planner@blr.gov.in', hash, 'city_planner']);

  // Insert 5 HRs (one per employer)
  for (let i = 0; i < EMPLOYERS.length; i++) {
    const hrId = genId('user');
    await db.run('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', 
      [hrId, 'HR ' + EMPLOYERS[i].name, `hr${i+1}@${EMPLOYERS[i].name.split(' ')[0].toLowerCase()}.com`, hash, 'employer']);
    // Actually HRs also need to be linked if we use their ID, but in prototype employer_id is just passed or fetched. We'll use the user ID as employer_id for HRs so the login works seamlessly.
    // Wait, the employer ID is already 'emp_1'. We should update the employers table so ID matches HR user ID for demo simplicity.
    await db.run('UPDATE employers SET id = ? WHERE name = ?', [hrId, EMPLOYERS[i].name]);
    EMPLOYERS[i].id = hrId;
  }

  // Ensure 'hr@techcorp.com' exists for the default demo script
  const hrDefaultId = genId('user');
  await db.run('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', 
      [hrDefaultId, 'TechCorp HR', 'hr@techcorp.com', hash, 'employer']);
  await db.run('INSERT INTO employers (id, name, city, points_to_perk_ratio) VALUES (?, ?, ?, ?)',
      [hrDefaultId, 'TechCorp', 'Bengaluru', 100]);
  EMPLOYERS.push({ id: hrDefaultId, name: 'TechCorp', city: 'Bengaluru' });

  // Generate 25 Commuters
  const commuters = [];
  for (let i = 1; i <= 25; i++) {
    const userId = genId('user');
    const comId = genId('com');
    const emp = randomChoice(EMPLOYERS);
    
    // Ensure 'arjun@techcorp.com' is created for the default demo
    const email = i === 1 ? 'arjun@techcorp.com' : `commuter${i}@${emp.name.split(' ')[0].toLowerCase()}.com`;
    const name = i === 1 ? 'Arjun' : `Commuter ${i}`;
    const employerId = i === 1 ? hrDefaultId : emp.id;
    const city = i === 1 ? 'Bengaluru' : emp.city;

    await db.run('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', 
      [userId, name, email, hash, 'commuter']);

    await db.run(
      `INSERT INTO commuters (id, user_id, employer_id, city, preferred_mode, total_co2_saved_kg, total_points, current_streak, badge, is_active) 
       VALUES (?, ?, ?, ?, ?, 0, 0, 0, 'Newbie', 1)`,
      [comId, userId, employerId, city, randomChoice(MODES)]
    );

    commuters.push({ id: comId, userId, city, employerId, total_co2: 0, total_points: 0, streak: 0 });
  }

  // Generate 200 realistic trips over the last 30 days
  for (let i = 0; i < 200; i++) {
    const com = randomChoice(commuters);
    const date = randomChoice(past30Days);
    const mode = randomChoice(MODES);
    const dist = parseFloat((Math.random() * 15 + 1).toFixed(1)); // 1km to 16km
    
    // Slight bias: weekdays have more trips, morning cycling
    if (date.getDay() === 0 || date.getDay() === 6) {
      if (Math.random() > 0.3) continue; // fewer weekend trips
    }

    const { co2_saved_kg } = calcCarbonKg(mode, dist);
    
    // Recalculate streak
    com.streak = calculateNewStreak(date.toISOString(), com.streak);
    const pts = calculatePoints(co2_saved_kg, mode, com.streak);
    
    const tripId = genId('trip');
    const txHash = generateTxHash({ tripId, commuterId: com.id, mode, dist, co2_saved_kg });

    // Insert trip with manipulated created_at
    const timeStr = `${date.toISOString().split('T')[0]} 09:${randomInt(10,59)}:00`;
    await db.run(
      `INSERT INTO trips (id, commuter_id, mode, distance_km, co2_saved_kg, points_earned, tx_hash, city, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tripId, com.id, mode, dist, co2_saved_kg, pts, txHash, com.city, timeStr]
    );

    com.total_co2 += co2_saved_kg;
    com.total_points += pts;
  }

  // Update commuters table with final aggregated stats
  for (let com of commuters) {
    const badge = assignBadge(com.total_co2);
    await db.run(
      'UPDATE commuters SET total_co2_saved_kg = ?, total_points = ?, current_streak = ?, badge = ? WHERE id = ?',
      [parseFloat(com.total_co2.toFixed(3)), com.total_points, com.streak, badge, com.id]
    );
  }

  logger.info('Seed complete! Test Accounts:');
  logger.info('Commuter: arjun@techcorp.com | pwd: password123');
  logger.info('Employer: hr@techcorp.com | pwd: password123');
  logger.info('Planner: planner@blr.gov.in | pwd: password123');
}

runSeed().catch(console.error);
