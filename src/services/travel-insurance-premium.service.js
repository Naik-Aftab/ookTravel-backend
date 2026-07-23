const premiumRepo = require('../repositories/travel-insurance-premium.repository');

async function getPremium(no_of_days) {
  const row = await premiumRepo.findByNoOfDays(no_of_days);
  if (!row) {
    throw Object.assign(
      new Error(`No premium configured for ${no_of_days} day(s)`),
      { statusCode: 404 }
    );
  }

  return {
    product: 'Travel Insurance',
    no_of_days: row.no_of_days,
    premium: Number(row.premium),
  };
}

module.exports = { getPremium };
