const policyRepo = require('../repositories/policy.repository');

// GET /api/app/policy-issue/agent/:agentId
// Returns issued policies shaped as IssuedPolicyRecord[] for the app commission screen
async function getAgentIssuedPolicies(req, res, next) {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (!agentId || isNaN(agentId)) {
      return res.status(400).json({ ok: false, data: [], message: 'agentId is required' });
    }

    const rows = await policyRepo.findIssuedPoliciesByAgent(agentId);

    const data = rows.map(p => ({
      id:               p.id,
      uuid:             p.uuid || String(p.id),
      no_of_days:       p.no_of_days || 0,
      premium:          String(p.premium || '0'),
      product:          p.product || 'Travel Insurance',
      quote_details:    {},
      traveller_details: (() => {
        try {
          return typeof p.traveller_details === 'string'
            ? JSON.parse(p.traveller_details)
            : (p.traveller_details || {});
        } catch { return {}; }
      })(),
      payment:    { status: 'paid' },
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));

    return res.json({ ok: true, data });
  } catch (e) { next(e); }
}

module.exports = { getAgentIssuedPolicies };
