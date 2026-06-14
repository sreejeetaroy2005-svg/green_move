// GreenMove — cron.js — refined for Round 2
const cron = require('node-cron');
const { getDb } = require('./db');
const logger = require('./logger');

/**
 * Aggregates trips into the carbon_log table.
 * Runs daily at midnight.
 */
async function aggregateDailyCarbonLog() {
  try {
    logger.info('Starting daily carbon_log aggregation...');
    const db = await getDb();
    
    // Get yesterday's date string (YYYY-MM-DD)
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const targetDate = date.toISOString().split('T')[0];

    // Fetch trips for yesterday, grouped by city
    const stats = await db.all(`
      SELECT 
        city,
        SUM(co2_saved_kg) as total_co2,
        COUNT(id) as total_trips
      FROM trips
      WHERE date(created_at) = ?
      GROUP BY city
    `, [targetDate]);

    for (let stat of stats) {
      // Calculate modal share
      const modesRaw = await db.all(`
        SELECT mode, COUNT(id) as count 
        FROM trips 
        WHERE date(created_at) = ? AND city = ?
        GROUP BY mode
      `, [targetDate, stat.city]);

      const modalShare = modesRaw.reduce((acc, row) => ({ ...acc, [row.mode]: row.count }), {});

      await db.run(`
        INSERT OR REPLACE INTO carbon_log (date, city, total_co2_kg, total_trips, modal_share_json)
        VALUES (?, ?, ?, ?, ?)
      `, [targetDate, stat.city, stat.total_co2, stat.total_trips, JSON.stringify(modalShare)]);
    }

    logger.info(`Daily aggregation completed for ${targetDate}. Processed ${stats.length} cities.`);
  } catch (err) {
    logger.error('Error during daily carbon_log aggregation:', err);
  }
}

// Schedule task to run at midnight (00:00) every day
function initCronJobs() {
  cron.schedule('0 0 * * *', () => {
    aggregateDailyCarbonLog();
  });
  logger.info('Cron jobs initialized: Daily aggregation set for midnight.');
}

module.exports = { initCronJobs, aggregateDailyCarbonLog };
