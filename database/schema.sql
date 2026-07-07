-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ooktravel`
--

CREATE DATABASE IF NOT EXISTS `ooktravel` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ooktravel`;

-- --------------------------------------------------------

--
-- Table structure for table `ooktravel_admins`
--

CREATE TABLE `ooktravel_admins` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','admin') DEFAULT 'admin',
  `is_active` tinyint(1) DEFAULT 1,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_exp` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ooktravel_agents`
--

CREATE TABLE `ooktravel_agents` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `agency_name` varchar(150) DEFAULT NULL,
  `pan` varchar(20) DEFAULT NULL,
  `gst` varchar(20) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `bank_account` varchar(50) DEFAULT NULL,
  `bank_ifsc` varchar(20) DEFAULT NULL,
  `bank_branch` varchar(100) DEFAULT NULL,
  `account_holder_name` varchar(100) DEFAULT NULL,
  `kyc_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `status` enum('pending','active','suspended') DEFAULT 'pending',
  `assigned_rm_id` int(11) DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `pan_document` varchar(255) DEFAULT NULL,
  `gst_document` varchar(255) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ooktravel_audit_logs`
--

CREATE TABLE `ooktravel_audit_logs` (
  `id` int(11) NOT NULL,
  `user_type` enum('admin','rm','agent') NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_name` varchar(100) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ooktravel_commissions`
--

CREATE TABLE `ooktravel_commissions` (
  `id` int(11) NOT NULL,
  `policy_id` int(11) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `premium_amount` decimal(10,2) NOT NULL,
  `commission_rate` decimal(5,2) DEFAULT 15.00,
  `commission_amount` decimal(10,2) NOT NULL,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `pending_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','partial','paid') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ooktravel_commission_payments`
--

CREATE TABLE `ooktravel_commission_payments` (
  `id` int(11) NOT NULL,
  `commission_id` int(11) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `payment_amount` decimal(10,2) NOT NULL,
  `utr_number` varchar(100) DEFAULT NULL,
  `payment_date` date NOT NULL,
  `payment_proof` varchar(255) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ooktravel_notifications`
--

CREATE TABLE `ooktravel_notifications` (
  `id` int(11) NOT NULL,
  `user_type` enum('admin','rm','agent') NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ooktravel_otps`
--

CREATE TABLE `ooktravel_otps` (
  `id` int(11) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `purpose` enum('signup','forgot_password') NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `attempts` int(11) DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ooktravel_policies`
--

CREATE TABLE `ooktravel_policies` (
  `id` int(11) NOT NULL,
  `policy_number` varchar(100) NOT NULL,
  `request_id` int(11) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `rm_id` int(11) NOT NULL,
  `provider_name` varchar(100) NOT NULL,
  `plan_name` varchar(100) NOT NULL,
  `premium_amount` decimal(10,2) NOT NULL,
  `coverage_amount` decimal(12,2) DEFAULT NULL,
  `issue_date` date NOT NULL,
  `expiry_date` date NOT NULL,
  `policy_pdf` varchar(255) DEFAULT NULL,
  `status` enum('active','expired','claimed','cancelled') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ooktravel_policy_requests`
--

CREATE TABLE `ooktravel_policy_requests` (
  `id` int(11) NOT NULL,
  `request_number` varchar(50) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `rm_id` int(11) DEFAULT NULL,
  `traveler_name` varchar(100) DEFAULT NULL,
  `traveler_mobile` varchar(15) DEFAULT NULL,
  `traveler_email` varchar(100) DEFAULT NULL,
  `travel_date` date NOT NULL,
  `return_date` date NOT NULL,
  `num_travelers` int(11) DEFAULT 1,
  `plan_type` varchar(100) DEFAULT NULL,
  `no_of_days` int(11) DEFAULT NULL,
  `estimated_premium` decimal(10,2) DEFAULT NULL,
  `payment_amount` decimal(10,2) DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `payment_screenshot` varchar(255) DEFAULT NULL,
  `status` enum('submitted','assigned','under_review','issued','expired','claimed','rejected') DEFAULT 'submitted',
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `traveller_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`traveller_details`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ooktravel_rms`
--

CREATE TABLE `ooktravel_rms` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('pending','active','suspended') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

ALTER TABLE `ooktravel_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `ooktravel_agents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `mobile` (`mobile`),
  ADD KEY `assigned_rm_id` (`assigned_rm_id`);

ALTER TABLE `ooktravel_audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_type`,`user_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_created` (`created_at`);

ALTER TABLE `ooktravel_commissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `policy_id` (`policy_id`),
  ADD KEY `idx_agent` (`agent_id`),
  ADD KEY `idx_status` (`status`);

ALTER TABLE `ooktravel_commission_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `commission_id` (`commission_id`),
  ADD KEY `agent_id` (`agent_id`),
  ADD KEY `created_by` (`created_by`);

ALTER TABLE `ooktravel_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_type`,`user_id`),
  ADD KEY `idx_read` (`is_read`);

ALTER TABLE `ooktravel_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_phone_purpose` (`phone`,`purpose`),
  ADD KEY `idx_expires` (`expires_at`);

ALTER TABLE `ooktravel_policies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `policy_number` (`policy_number`),
  ADD KEY `request_id` (`request_id`),
  ADD KEY `idx_agent` (`agent_id`),
  ADD KEY `idx_rm` (`rm_id`);

ALTER TABLE `ooktravel_policy_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `request_number` (`request_number`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_agent` (`agent_id`),
  ADD KEY `idx_rm` (`rm_id`);

ALTER TABLE `ooktravel_rms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `mobile` (`mobile`),
  ADD KEY `approved_by` (`approved_by`);

--
-- AUTO_INCREMENT for dumped tables
--

ALTER TABLE `ooktravel_admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ooktravel_agents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ooktravel_audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ooktravel_commissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ooktravel_commission_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ooktravel_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ooktravel_otps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ooktravel_policies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ooktravel_policy_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ooktravel_rms`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

ALTER TABLE `ooktravel_agents`
  ADD CONSTRAINT `ooktravel_agents_ibfk_1` FOREIGN KEY (`assigned_rm_id`) REFERENCES `ooktravel_rms` (`id`) ON DELETE SET NULL;

ALTER TABLE `ooktravel_commissions`
  ADD CONSTRAINT `ooktravel_commissions_ibfk_1` FOREIGN KEY (`policy_id`) REFERENCES `ooktravel_policies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ooktravel_commissions_ibfk_2` FOREIGN KEY (`agent_id`) REFERENCES `ooktravel_agents` (`id`) ON DELETE CASCADE;

ALTER TABLE `ooktravel_commission_payments`
  ADD CONSTRAINT `ooktravel_commission_payments_ibfk_1` FOREIGN KEY (`commission_id`) REFERENCES `ooktravel_commissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ooktravel_commission_payments_ibfk_2` FOREIGN KEY (`agent_id`) REFERENCES `ooktravel_agents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ooktravel_commission_payments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `ooktravel_admins` (`id`) ON DELETE CASCADE;

ALTER TABLE `ooktravel_policies`
  ADD CONSTRAINT `ooktravel_policies_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `ooktravel_policy_requests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ooktravel_policies_ibfk_2` FOREIGN KEY (`agent_id`) REFERENCES `ooktravel_agents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ooktravel_policies_ibfk_3` FOREIGN KEY (`rm_id`) REFERENCES `ooktravel_rms` (`id`) ON DELETE CASCADE;

ALTER TABLE `ooktravel_policy_requests`
  ADD CONSTRAINT `ooktravel_policy_requests_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `ooktravel_agents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ooktravel_policy_requests_ibfk_2` FOREIGN KEY (`rm_id`) REFERENCES `ooktravel_rms` (`id`) ON DELETE SET NULL;

ALTER TABLE `ooktravel_rms`
  ADD CONSTRAINT `ooktravel_rms_ibfk_1` FOREIGN KEY (`approved_by`) REFERENCES `ooktravel_admins` (`id`) ON DELETE SET NULL;

-- --------------------------------------------------------

--
-- Table structure for table `ooktravel_payment_orders`
-- Tracks Cashfree orders so the webhook can recover a policy request if the app never
-- confirms a successful payment back to the server (killed app, dropped network, etc).
--

CREATE TABLE `ooktravel_payment_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) NOT NULL,
  `agent_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('created','fulfilled','failed') NOT NULL DEFAULT 'created',
  `request_payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`request_payload`)),
  `policy_request_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  CONSTRAINT `ooktravel_payment_orders_ibfk_1` FOREIGN KEY (`agent_id`) REFERENCES `ooktravel_agents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ooktravel_payment_orders_ibfk_2` FOREIGN KEY (`policy_request_id`) REFERENCES `ooktravel_policy_requests` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
