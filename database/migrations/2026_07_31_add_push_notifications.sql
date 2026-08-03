-- Adds device push-token storage for agents (Expo Push Service tokens) and extends
-- ooktravel_notifications so admin-initiated sends can be categorized, attributed to
-- the sending admin, and traced back to how the recipients were targeted.

CREATE TABLE `ooktravel_push_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `agent_id` int(11) NOT NULL,
  `expo_push_token` varchar(255) NOT NULL,
  `platform` enum('ios','android') NOT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `expo_push_token` (`expo_push_token`),
  KEY `idx_agent` (`agent_id`),
  CONSTRAINT `ooktravel_push_tokens_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `ooktravel_agents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per admin "send" action (single or bulk) — lets the dashboard show send
-- history/recipient counts without grouping near-duplicate notification rows.
CREATE TABLE `ooktravel_notification_batches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `category` enum('marketing','kyc_update','commission_paid','general') NOT NULL,
  `target_type` enum('single','all','status','kyc_status','rm') NOT NULL,
  `target_meta` varchar(100) DEFAULT NULL,
  `recipient_count` int(11) NOT NULL DEFAULT 0,
  `push_sent_count` int(11) NOT NULL DEFAULT 0,
  `push_failed_count` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_admin` (`admin_id`),
  CONSTRAINT `ooktravel_notification_batches_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `ooktravel_admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `ooktravel_notifications`
  ADD COLUMN `category` enum('marketing','kyc_update','commission_paid','general') DEFAULT NULL AFTER `type`,
  ADD COLUMN `batch_id` int(11) DEFAULT NULL AFTER `category`,
  ADD KEY `idx_batch` (`batch_id`),
  ADD CONSTRAINT `ooktravel_notifications_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `ooktravel_notification_batches` (`id`) ON DELETE SET NULL;
