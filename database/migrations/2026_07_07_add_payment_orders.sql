-- Run this once against an existing ookTravel database to add Cashfree payment-order
-- tracking, used to reconcile a policy request if the app never confirms a successful
-- payment back to the server (killed app, dropped network, etc).

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
