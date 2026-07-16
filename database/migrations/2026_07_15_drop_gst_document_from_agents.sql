-- Run this once against an existing ookTravel database to drop the unused gst_document
-- column — it was never wired up to any upload flow (unlike bank_document, aadhar_document,
-- and pan_document, which are used by the bank details KYC upload feature).

ALTER TABLE `ooktravel_agents`
  DROP COLUMN `gst_document`;
