-- Run this once against an existing ookTravel database to add document-upload columns for
-- the bank details form (bank passbook / cancelled cheque, Aadhar card). `pan_document`
-- already existed in the schema but was never wired up — it's now used for the PAN card upload.

ALTER TABLE `ooktravel_agents`
  ADD COLUMN `bank_document` varchar(255) DEFAULT NULL AFTER `pan_document`,
  ADD COLUMN `aadhar_document` varchar(255) DEFAULT NULL AFTER `bank_document`;
