-- Run this once against an existing ookTravel database to remove the unused agency_name and
-- gst fields from agents. Neither was ever settable from signup/profile forms and both are
-- empty for every existing agent.

ALTER TABLE `ooktravel_agents`
  DROP COLUMN `agency_name`,
  DROP COLUMN `gst`;
