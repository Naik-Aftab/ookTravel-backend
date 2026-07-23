const { queryOne } = require('../config/database');

async function findByNoOfDays(no_of_days) {
  return queryOne(
    'SELECT id, no_of_days, premium FROM ooktravel_travel_insurance_premiums WHERE no_of_days = ?',
    [no_of_days]
  );
}

module.exports = { findByNoOfDays };
