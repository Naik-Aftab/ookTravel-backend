-- Run this once against an existing ookTravel database to replace the bank details form's
-- "Branch Name" field with "Aadhar Card Number". Note: this drops any existing bank_branch
-- values — back them up first if you need to keep them.

ALTER TABLE `ooktravel_agents`
  ADD COLUMN `aadhar_number` varchar(20) DEFAULT NULL AFTER `bank_ifsc`;

ALTER TABLE `ooktravel_agents`
  DROP COLUMN `bank_branch`;
