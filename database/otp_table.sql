-- ============================================================
-- OOK Travel - OTP Table Migration
-- Run this in your MySQL database (ooktravel)
-- ============================================================

USE ooktravel;

CREATE TABLE IF NOT EXISTS ooktravel_otps (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  phone       VARCHAR(15)  NOT NULL,
  otp         VARCHAR(6)   NOT NULL,
  purpose     ENUM('signup','forgot_password') NOT NULL,
  is_used     TINYINT(1)   DEFAULT 0,
  attempts    INT          DEFAULT 0,
  expires_at  DATETIME     NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_phone_purpose (phone, purpose),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;
