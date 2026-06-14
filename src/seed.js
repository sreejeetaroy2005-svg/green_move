const bcrypt = require('bcryptjs');
const { getDb } = require('./db');
const { genId, generateTxHash, calculatePoints, assignBadge } = require('./helpers');
const { calcCarbonKg } = require('./carbon-engine');

async function seed() {
  const db = await getDb();
  
  console.log('Seeding database...');
  
  // Clear tables
  await db.exec(`
    DELETE FROM trips;
    DELETE FROM transactions;
    DELETE FROM rewards;
    DELETE FROM commuters;
    DELETE FROM employers;
    DELETE FROM users;
  `);

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Employers
  const emp1 = genId('emp');
  const emp2 = genId('emp');
  
  await db.run('INSERT INTO employers (id, name, city, points_to_perk_ratio) VALUES (?, ?, ?, ?)', [emp1, 'TechCorp Bengaluru', 'Bengaluru', 100]);
  await db.run('INSERT INTO employers (id, name, city, points_to_perk_ratio) VALUES (?, ?, ?, ?)', [emp2, 'GreenInnovate Inc', 'Bengaluru', 100]);

  // Employer User
  const empUserId = genId('user');
  await db.run('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [empUserId, 'TechCorp HR', 'hr@techcorp.com', passwordHash, 'employer']);

  // City Planner User
  const plannerId = genId('user');
  await db.run('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [plannerId, 'BBMP Official', 'planner@blr.gov.in', passwordHash, 'city_planner']);

  // 2. Commuters
  const commuters = [
    { name: 'Arjun M.', email: 'arjun@techcorp.com', mode: 'cycle', emp_id: emp1 },
    { name: 'Priya K.', email: 'priya@techcorp.com', mode: 'metro', emp_id: emp1 },
    { name: 'Rahul S.', email: 'rahul@techcorp.com', mode: 'bus', emp_id: emp1 },
    { name: 'Sneha R.', email: 'sneha@greeninnovate.com', mode: 'walk', emp_id: emp2 },
    { name: 'Vikram B.', email: 'vikram@greeninnovate.com', mode: 'carpool', emp_id: emp2 }
  ];

  for (let c of commuters) {
    const userId = genId('user');
    await db.run('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [userId, c.name, c.email, passwordHash, 'commuter']);
    
    const commuterId = genId('com');
    c.commuterId = commuterId; // save for later
    
    await db.run(`
      INSERT INTO commuters (id, user_id, employer_id, city, preferred_mode, total_co2_saved_kg, total_points, current_streak, badge)
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, '🌱 Green Starter')
    `, [commuterId, userId, c.emp_id, 'Bengaluru', c.mode]);
  }

  // 3. Trips (Generate 10 trips per commuter over the last 10 days)
  for (let c of commuters) {
    let total_co2 = 0;
    let total_points = 0;
    let streak = 10;
    let badge = '';

    for (let i = 10; i >= 1; i--) {
      const mode = Math.random() > 0.2 ? c.mode : 'carpool'; // 80% use preferred mode
      const distance = parseFloat((Math.random() * 15 + 2).toFixed(1)); // 2 to 17 km
      const { co2_saved_kg } = calcCarbonKg(mode, distance);
      
      const pts = calculatePoints(co2_saved_kg, mode, 10 - i + 1); // rough streak emulation
      total_co2 += co2_saved_kg;
      total_points += pts;
      
      const tripId = genId('trip');
      const txHash = generateTxHash({ trip_id: tripId, commuter_id: c.commuterId, mode, distance_km: distance, co2_saved_kg });
      
      // Calculate a date
      const date = new Date();
      date.setDate(date.getDate() - i);
      const created_at = date.toISOString();

      await db.run(`
        INSERT INTO trips (id, commuter_id, mode, distance_km, co2_saved_kg, points_earned, tx_hash, city, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [tripId, c.commuterId, mode, distance, co2_saved_kg, pts, txHash, 'Bengaluru', created_at]);

      const txId = genId('tx');
      await db.run('INSERT INTO transactions (id, hash, trip_id, created_at) VALUES (?, ?, ?, ?)', [txId, txHash, tripId, created_at]);
    }

    badge = assignBadge(total_co2, 10, streak);
    await db.run(`
      UPDATE commuters 
      SET total_co2_saved_kg = ?, total_points = ?, current_streak = ?, badge = ?
      WHERE id = ?
    `, [parseFloat(total_co2.toFixed(3)), total_points, streak, badge, c.commuterId]);
  }

  console.log('Seeding complete! Default passwords for all accounts: password123');
  console.log('Commuter: arjun@techcorp.com');
  console.log('Employer: hr@techcorp.com');
  console.log('City Planner: planner@blr.gov.in');
}

seed().catch(console.error);
