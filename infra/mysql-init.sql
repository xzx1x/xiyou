CREATE DATABASE IF NOT EXISTS `campus_chain` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `campus_chain`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(100) NOT NULL,
  `identity_code` VARCHAR(64) NOT NULL UNIQUE,
  `nickname` VARCHAR(100) NULL,
  `role` ENUM('USER', 'COUNSELOR', 'ADMIN') NOT NULL DEFAULT 'USER',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `identity_whitelist` (
  `identity_code` VARCHAR(64) NOT NULL PRIMARY KEY,
  `default_role` ENUM('USER', 'COUNSELOR', 'ADMIN') NOT NULL DEFAULT 'USER',
  `description` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `identity_whitelist` (`identity_code`, `default_role`, `description`)
VALUES
  ('202202102', 'USER', '示例普通用户账号 A'),
  ('202202103', 'USER', '示例普通用户账号 B'),
  ('202202104', 'USER', '示例普通用户账号 C'),
  ('123456', 'ADMIN', '示例管理员账号')
ON DUPLICATE KEY UPDATE
  `default_role` = VALUES(`default_role`),
  `description` = VALUES(`description`),
  `updated_at` = CURRENT_TIMESTAMP;
