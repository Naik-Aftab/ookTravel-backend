-- Supports in-app account deletion (Apple App Store Guideline 5.1.1(v)).
-- Agents are soft-deleted, not hard-deleted, because ooktravel_policies,
-- ooktravel_commissions, ooktravel_commission_payments, and ooktravel_payment_orders
-- all have ON DELETE CASCADE on agent_id — a hard delete would destroy financial/
-- insurance records that need to be retained. PII is scrubbed instead; this column
-- marks the account as gone and blocks login.

ALTER TABLE `ooktravel_agents`
  ADD COLUMN `deleted_at` datetime DEFAULT NULL AFTER `updated_at`;
