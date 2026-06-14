const EMISSION_FACTORS = {
  walk: 0,
  cycle: 0,
  metro: 41,
  bus: 89,
  carpool: 43,
  car: 192 // baseline private car
};

/**
 * Calculates CO2 savings and equivalents
 * @param {string} mode - Mode of transport
 * @param {number} distance_km - Distance in km
 * @returns {object} { co2_saved_kg, equivalent_bottles_recycled, trees_equivalent }
 */
function calcCarbonKg(mode, distance_km) {
  const modeKey = mode.toLowerCase();
  const modeFactor = EMISSION_FACTORS[modeKey] !== undefined ? EMISSION_FACTORS[modeKey] : EMISSION_FACTORS.car;
  const baselineFactor = EMISSION_FACTORS.car;

  // Formula: co2_saved_kg = (192 - mode_factor) × distance_km / 1000
  let co2_saved_kg = ((baselineFactor - modeFactor) * distance_km) / 1000;
  
  // To avoid negative if somehow someone logs car vs car
  if (co2_saved_kg < 0) co2_saved_kg = 0;

  // Equivalents (mock formulas for display)
  // 1 kg CO2 ~ 100 plastic bottles recycled
  const equivalent_bottles_recycled = Math.round(co2_saved_kg * 100);
  // 1 tree absorbs ~21kg CO2 per year, so 1 kg CO2 ~ 1/21 of a tree's yearly work
  const trees_equivalent = parseFloat((co2_saved_kg / 21).toFixed(2));

  return {
    co2_saved_kg: parseFloat(co2_saved_kg.toFixed(3)),
    equivalent_bottles_recycled,
    trees_equivalent
  };
}

module.exports = {
  EMISSION_FACTORS,
  calcCarbonKg
};
