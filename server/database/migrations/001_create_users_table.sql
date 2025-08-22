-- 创建用户表迁移文件
-- 创建时间: 2024-01-15
-- 描述: 创建用户表并插入初始用户数据

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'user',
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `last_login_at` datetime DEFAULT NULL,
  `last_login_ip` varchar(45) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_username` (`username`),
  UNIQUE KEY `IDX_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 插入初始用户数据
INSERT INTO `users` (`username`, `email`, `password`, `role`, `enabled`) VALUES
('admin', 'admin@example.com', '$2b$10$WPoC6KwtbYZc5JvTL9iSyurfYDzGLbYlQNPu2CmAECSChEPxNpdg.', 'admin', 1),
('user', 'user@example.com', '$2b$10$6p08SZJdVYhcqTkQpDEZGuVYReNePj0E4HuZ3Xx8.n/2lHEMOLhzK', 'user', 1);