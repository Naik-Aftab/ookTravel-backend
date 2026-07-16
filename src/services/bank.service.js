const path       = require('path');
const fs         = require('fs');
const agentRepo  = require('../repositories/agent.repository');

function buildBankDetailsResponse(row) {
  return {
    agent_id:            row.id,
    account_holder_name: row.account_holder_name,
    bank_name:           row.bank_name,
    account_number:      row.account_number,
    ifsc_code:           row.ifsc_code,
    aadhar_number:       row.aadhar_number,
    pan_card_number:     row.pan_card_number,
    bank_document:       row.bank_document,
    aadhar_document:     row.aadhar_document,
    pan_document:        row.pan_document,
  };
}

function deleteIfExists(relativePath) {
  if (!relativePath) return;
  const fullPath = path.join(__dirname, '../../', relativePath.replace(/^\//, ''));
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
}

// Documents are uploaded via multer .fields(), so each key on `files` (if present) is an
// array with a single file. Returns undefined (not null) for anything not uploaded on this
// request, so the repository's COALESCE keeps whatever was already stored.
function extractDocPaths(files) {
  const pick = (field) => files?.[field]?.[0];

  const bankFile   = pick('bank_document');
  const aadharFile = pick('aadhar_document');
  const panFile    = pick('pan_document');

  return {
    bank_document:   bankFile   ? `/uploads/kyc/${bankFile.filename}`   : undefined,
    aadhar_document: aadharFile ? `/uploads/kyc/${aadharFile.filename}` : undefined,
    pan_document:    panFile    ? `/uploads/kyc/${panFile.filename}`    : undefined,
  };
}

async function saveBankDetails(agent_id, data, files) {
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

  await agentRepo.saveBankDetails(agent_id, { ...data, ...extractDocPaths(files) });
  const updated = await agentRepo.getBankDetails(agent_id);
  return buildBankDetailsResponse(updated);
}

async function editBankDetails(agent_id, data, files) {
  const agent = await agentRepo.findById(agent_id);
  if (!agent) throw Object.assign(new Error('Agent not found'), { statusCode: 404 });

  const existing = await agentRepo.getBankDetails(agent_id);
  const docPaths = extractDocPaths(files);

  // Replace on disk only when a fresh document was actually uploaded for that slot.
  if (docPaths.bank_document)   deleteIfExists(existing?.bank_document);
  if (docPaths.aadhar_document) deleteIfExists(existing?.aadhar_document);
  if (docPaths.pan_document)    deleteIfExists(existing?.pan_document);

  await agentRepo.saveBankDetails(agent_id, { ...data, ...docPaths });
  const updated = await agentRepo.getBankDetails(agent_id);
  return buildBankDetailsResponse(updated);
}

module.exports = { saveBankDetails, editBankDetails };
