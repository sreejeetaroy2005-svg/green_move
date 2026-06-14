const crypto = require('crypto');

function genId(prefix = 'id') {
  return prefix + '_' + crypto.randomBytes(8).toString('hex');
}

// Mock blockchain transaction hash generation
function generateTxHash(tripData) {
  const dataString = JSON.stringify(tripData) + Date.now().toString();
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

function calculatePoints(co2_saved_kg, mode, streak) {
  let basePoints = Math.floor(co2_saved_kg * 10); // 1 point per 100g (0.1kg)

  if (mode === 'cycle' || mode === 'walk') {
    basePoints = Math.floor(basePoints * 1.5);
  }

  if (streak >= 5) {
    basePoints = basePoints * 2;
  }

  return basePoints;
}

function assignBadge(total_co2_saved_kg, numTrips, streak) {
  if (total_co2_saved_kg >= 50) return '🏆 Green Champion';
  if (total_co2_saved_kg >= 10) return '🌍 Carbon Saver';
  if (streak >= 7) return '⚡ Streak Master';
  if (numTrips >= 10) return '🚴 Cycle Hero'; // assuming cycle trips logic handled externally or generally
  if (numTrips >= 1) return '🌱 Green Starter';
  return 'Newbie';
}

module.exports = {
  genId,
  generateTxHash,
  calculatePoints,
  assignBadge
};
