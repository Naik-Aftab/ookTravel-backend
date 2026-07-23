-- Run this once against an existing ookTravel database to add the static
-- travel insurance premium lookup table (premium amount by number of days).

CREATE TABLE `ooktravel_travel_insurance_premiums` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `no_of_days` int(11) NOT NULL,
  `premium` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `no_of_days` (`no_of_days`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ooktravel_travel_insurance_premiums` (`no_of_days`, `premium`) VALUES
(1, 59),
(2, 59),
(3, 59),
(4, 59),
(5, 71),
(6, 83),
(7, 95),
(8, 107),
(9, 119),
(10, 131),
(11, 143),
(12, 155),
(13, 167),
(14, 179),
(15, 191);
