-- ============================================================
-- Migration: Add account_holder_name to ooktravel_agents
-- Run this in your MySQL database (ooktravel)
-- ============================================================

USE ooktravel;

ALTER TABLE ooktravel_agents
  ADD COLUMN account_holder_name VARCHAR(100) NULL AFTER bank_branch;
