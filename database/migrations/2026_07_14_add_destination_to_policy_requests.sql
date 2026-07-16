-- Run this once against an existing ookTravel database to add a first-class destination
-- column to policy requests (previously only available inside the traveller_details JSON blob).

ALTER TABLE `ooktravel_policy_requests`
  ADD COLUMN `destination` varchar(100) DEFAULT NULL AFTER `traveler_email`;
