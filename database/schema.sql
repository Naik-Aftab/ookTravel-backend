-- ============================================================
-- OOK Travel Insurance Platform - MySQL Database Schema
-- Execute this file in your MySQL database to create all tables
-- ============================================================

CREATE DATABASE IF NOT EXISTS ooktravel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ooktravel;

-- ============================================================
-- TABLE: ooktravel_admins
-- ============================================================
CREATE TABLE IF NOT EXISTS ooktravel_admins (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  full_name       VARCHAR(100)  NOT NULL,
  email           VARCHAR(100)  NOT NULL UNIQUE,
  password        VARCHAR(255)  NOT NULL,
  role            ENUM('super_admin','admin') DEFAULT 'admin',
  is_active       TINYINT(1)    DEFAULT 1,
  reset_token     VARCHAR(255)  NULL,
  reset_token_exp DATETIME      NULL,
  last_login      DATETIME      NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default super admin (password: Admin@123)
INSERT INTO ooktravel_admins (full_name, email, password, role) VALUES
('Super Admin', 'admin@ooktravel.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBYAlNLNnBnMOS', 'super_admin');

-- ============================================================
-- TABLE: ooktravel_rms
-- ============================================================
CREATE TABLE IF NOT EXISTS ooktravel_rms (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  full_name       VARCHAR(100)  NOT NULL,
  email           VARCHAR(100)  NOT NULL UNIQUE,
  mobile          VARCHAR(15)   NOT NULL UNIQUE,
  password        VARCHAR(255)  NOT NULL,
  status          ENUM('pending','active','suspended') DEFAULT 'pending',
  approved_by     INT           NULL,
  approved_at     DATETIME      NULL,
  last_login      DATETIME      NULL,
  refresh_token   TEXT          NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (approved_by) REFERENCES ooktravel_admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: ooktravel_agents
-- ============================================================
CREATE TABLE IF NOT EXISTS ooktravel_agents (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  full_name        VARCHAR(100)  NOT NULL,
  email            VARCHAR(100)  NOT NULL UNIQUE,
  mobile           VARCHAR(15)   NOT NULL UNIQUE,
  password         VARCHAR(255)  NOT NULL,
  agency_name      VARCHAR(150)  NULL,
  pan              VARCHAR(20)   NULL,
  gst              VARCHAR(20)   NULL,
  bank_name        VARCHAR(100)  NULL,
  bank_account     VARCHAR(50)   NULL,
  bank_ifsc        VARCHAR(20)   NULL,
  bank_branch      VARCHAR(100)  NULL,
  kyc_status       ENUM('pending','verified','rejected') DEFAULT 'pending',
  status           ENUM('pending','active','suspended')  DEFAULT 'pending',
  assigned_rm_id   INT           NULL,
  profile_photo    VARCHAR(255)  NULL,
  pan_document     VARCHAR(255)  NULL,
  gst_document     VARCHAR(255)  NULL,
  last_login       DATETIME      NULL,
  refresh_token    TEXT          NULL,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_rm_id) REFERENCES ooktravel_rms(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: ooktravel_policy_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS ooktravel_policy_requests (
  id                   INT PRIMARY KEY AUTO_INCREMENT,
  request_number       VARCHAR(50)   NOT NULL UNIQUE,
  agent_id             INT           NOT NULL,
  rm_id                INT           NULL,
  traveler_name        VARCHAR(100)  NULL,
  traveler_mobile      VARCHAR(15)   NULL,
  traveler_email       VARCHAR(100)  NULL,
  travel_date          DATE          NOT NULL,
  return_date          DATE          NOT NULL,
  num_travelers        INT           DEFAULT 1,
  plan_type            VARCHAR(100)  NULL,
  no_of_days           INT           NULL,
  estimated_premium    DECIMAL(10,2) NULL,
  payment_amount       DECIMAL(10,2) NULL,
  payment_reference    VARCHAR(100)  NULL,
  payment_screenshot   VARCHAR(255)  NULL,
  traveller_details    JSON          NULL,
  status               ENUM('submitted','assigned','under_review','issued','expired','claimed','rejected') DEFAULT 'submitted',
  remarks              TEXT          NULL,
  created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES ooktravel_agents(id) ON DELETE CASCADE,
  FOREIGN KEY (rm_id)    REFERENCES ooktravel_rms(id)    ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: ooktravel_policies
-- ============================================================
CREATE TABLE IF NOT EXISTS ooktravel_policies (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  policy_number    VARCHAR(100)  NOT NULL UNIQUE,
  request_id       INT           NOT NULL,
  agent_id         INT           NOT NULL,
  rm_id            INT           NOT NULL,
  provider_name    VARCHAR(100)  NOT NULL,
  plan_name        VARCHAR(100)  NOT NULL,
  premium_amount   DECIMAL(10,2) NOT NULL,
  coverage_amount  DECIMAL(12,2) NULL,
  issue_date       DATE          NOT NULL,
  expiry_date      DATE          NOT NULL,
  policy_pdf       VARCHAR(255)  NULL,
  status           ENUM('active','expired','claimed','cancelled') DEFAULT 'active',
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES ooktravel_policy_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id)   REFERENCES ooktravel_agents(id)          ON DELETE CASCADE,
  FOREIGN KEY (rm_id)      REFERENCES ooktravel_rms(id)             ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: ooktravel_commissions
-- ============================================================
CREATE TABLE IF NOT EXISTS ooktravel_commissions (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  policy_id         INT           NOT NULL UNIQUE,
  agent_id          INT           NOT NULL,
  premium_amount    DECIMAL(10,2) NOT NULL,
  commission_rate   DECIMAL(5,2)  DEFAULT 25.00,
  commission_amount DECIMAL(10,2) NOT NULL,
  paid_amount       DECIMAL(10,2) DEFAULT 0.00,
  pending_amount    DECIMAL(10,2) NOT NULL,
  status            ENUM('pending','partial','paid') DEFAULT 'pending',
  created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (policy_id) REFERENCES ooktravel_policies(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id)  REFERENCES ooktravel_agents(id)   ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: ooktravel_commission_payments
-- ============================================================
CREATE TABLE IF NOT EXISTS ooktravel_commission_payments (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  commission_id   INT           NOT NULL,
  agent_id        INT           NOT NULL,
  payment_amount  DECIMAL(10,2) NOT NULL,
  utr_number      VARCHAR(100)  NULL,
  payment_date    DATE          NOT NULL,
  payment_proof   VARCHAR(255)  NULL,
  remarks         TEXT          NULL,
  created_by      INT           NOT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (commission_id) REFERENCES ooktravel_commissions(id)     ON DELETE CASCADE,
  FOREIGN KEY (agent_id)      REFERENCES ooktravel_agents(id)          ON DELETE CASCADE,
  FOREIGN KEY (created_by)    REFERENCES ooktravel_admins(id)          ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: ooktravel_notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS ooktravel_notifications (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  user_type    ENUM('admin','rm','agent') NOT NULL,
  user_id      INT           NOT NULL,
  title        VARCHAR(200)  NOT NULL,
  message      TEXT          NOT NULL,
  type         VARCHAR(50)   NULL,
  entity_type  VARCHAR(50)   NULL,
  entity_id    INT           NULL,
  is_read      TINYINT(1)    DEFAULT 0,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_type, user_id),
  INDEX idx_read (is_read)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: ooktravel_audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS ooktravel_audit_logs (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  user_type    ENUM('admin','rm','agent') NOT NULL,
  user_id      INT           NOT NULL,
  user_name    VARCHAR(100)  NULL,
  action       VARCHAR(100)  NOT NULL,
  entity_type  VARCHAR(50)   NULL,
  entity_id    INT           NULL,
  old_values   JSON          NULL,
  new_values   JSON          NULL,
  ip_address   VARCHAR(45)   NULL,
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user    (user_type, user_id),
  INDEX idx_entity  (entity_type, entity_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================================
-- Indexes for performance
-- ============================================================
ALTER TABLE ooktravel_policy_requests ADD INDEX idx_status  (status);
ALTER TABLE ooktravel_policy_requests ADD INDEX idx_agent   (agent_id);
ALTER TABLE ooktravel_policy_requests ADD INDEX idx_rm      (rm_id);
ALTER TABLE ooktravel_policies        ADD INDEX idx_agent   (agent_id);
ALTER TABLE ooktravel_policies        ADD INDEX idx_rm      (rm_id);
ALTER TABLE ooktravel_commissions     ADD INDEX idx_agent   (agent_id);
ALTER TABLE ooktravel_commissions     ADD INDEX idx_status  (status);

-- ============================================================
-- Migration: run once on existing databases
-- ============================================================
-- ALTER TABLE ooktravel_policy_requests
--   DROP COLUMN destination,
--   DROP COLUMN coverage_amount,
--   MODIFY COLUMN traveler_name VARCHAR(100) NULL,
--   ADD COLUMN traveller_details JSON NULL;
