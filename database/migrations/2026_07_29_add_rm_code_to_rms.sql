-- Lets an agent be assigned to a specific RM at signup by entering that RM's code,
-- instead of the previous placeholder logic in auth.service.js -> agentSignup which
-- auto-assigned every new agent to "the first active RM" it found.
-- Existing RMs are backfilled with a code derived from their id so nothing breaks
-- for RMs created before this change.

ALTER TABLE `ooktravel_rms`
  ADD COLUMN `rm_code` varchar(20) DEFAULT NULL AFTER `mobile`;

UPDATE `ooktravel_rms` SET `rm_code` = CONCAT('RM', LPAD(`id`, 4, '0')) WHERE `rm_code` IS NULL;

ALTER TABLE `ooktravel_rms`
  MODIFY `rm_code` varchar(20) NOT NULL,
  ADD UNIQUE KEY `rm_code` (`rm_code`);
