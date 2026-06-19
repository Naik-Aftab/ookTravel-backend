const agentRepo = require('../repositories/agent.repository');

function buildBankDetailsResponse(row) {
  return {
    agent_id:            row.id,
    account_holder_name: row.account_holder_name,
    bank_name:           row.bank_name,
    account_number:      row.account_number,
    ifsc_code:           row.ifsc_code,
    branch_name:         row.branch_name,
    pan_card_number:     row.pan_card_number,
  };
}

async function saveBankDetails(agent_id, data) {
  const agent = await agentRepo.findById(agent_id);
  if (!agent) throw Object.assign(new Error('Agent not found'), { statusCode: 404 });

  // Block save if bank details already exist
  const existing = await agentRepo.getBankDetails(agent_id);
  if (existing && existing.bank_name) {
    throw Object.assign(
      new Error('Bank details already exist. Use the edit endpoint to update.'),
      { statusCode: 409 }
    );
  }

  await agentRepo.saveBankDetails(agent_id, data);
  const updated = await agentRepo.getBankDetails(agent_id);
  return buildBankDetailsResponse(updated);
}

async function editBankDetails(agent_id, data) {
  const agent = await agentRepo.findById(agent_id);
  if (!agent) throw Object.assign(new Error('Agent not found'), { statusCode: 404 });

  await agentRepo.saveBankDetails(agent_id, data);
  const updated = await agentRepo.getBankDetails(agent_id);
  return buildBankDetailsResponse(updated);
}

module.exports = { saveBankDetails, editBankDetails };
