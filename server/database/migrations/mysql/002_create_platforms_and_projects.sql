-- 创建平台信息表
CREATE TABLE platforms (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  platform_code VARCHAR(50) NOT NULL UNIQUE COMMENT '平台代码',
  platform_name VARCHAR(100) NOT NULL COMMENT '平台名称',
  platform_category ENUM('web', 'mobile', 'desktop', 'server') NOT NULL COMMENT '平台分类',
  sdk_version VARCHAR(50) COMMENT 'SDK版本要求',
  platform_icon VARCHAR(255) COMMENT '平台图标',
  description TEXT COMMENT '平台描述',
  special_config TEXT COMMENT '特殊配置JSON',
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_platform_code (platform_code),
  INDEX idx_platform_category (platform_category),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台信息表';

-- 创建项目表
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  project_id VARCHAR(100) NOT NULL UNIQUE COMMENT '项目唯一标识',
  project_name VARCHAR(200) NOT NULL COMMENT '项目名称',
  description TEXT COMMENT '项目描述',
  owner_id VARCHAR(100) COMMENT '项目负责人ID',
  team_id VARCHAR(100) COMMENT '团队ID',
  domain VARCHAR(500) COMMENT '项目域名',
  
  -- 监控配置
  error_sampling_rate DECIMAL(3,2) DEFAULT 1.00 COMMENT '错误采样率',
  performance_sampling_rate DECIMAL(3,2) DEFAULT 0.10 COMMENT '性能采样率',
  session_sampling_rate DECIMAL(3,2) DEFAULT 0.05 COMMENT '会话采样率',
  data_retention_days INT DEFAULT 30 COMMENT '数据保留天数',
  
  -- 告警配置
  alert_rules TEXT COMMENT '告警规则JSON',
  notification_config TEXT COMMENT '通知配置JSON',
  alert_threshold INT DEFAULT 10 COMMENT '告警阈值',
  alert_email VARCHAR(255) COMMENT '告警邮箱',
  
  -- SourceMap配置
  sourcemap_config TEXT COMMENT 'SourceMap配置JSON',
  
  -- 高级配置
  ip_whitelist TEXT COMMENT 'IP白名单JSON',
  user_agent_filters TEXT COMMENT '用户代理过滤规则JSON',
  custom_tags TEXT COMMENT '自定义标签JSON',
  
  -- 状态管理
  is_active BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  is_paused BOOLEAN DEFAULT FALSE COMMENT '是否暂停监控',
  api_key VARCHAR(100) COMMENT 'API密钥',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  INDEX idx_project_id (project_id),
  INDEX idx_team_id (team_id),
  INDEX idx_owner_id (owner_id),
  INDEX idx_is_active (is_active),
  INDEX idx_is_paused (is_paused)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目配置表';

-- 创建项目平台关联表
CREATE TABLE project_platforms (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  project_id INT NOT NULL COMMENT '项目ID',
  platform_id INT NOT NULL COMMENT '平台ID',
  is_enabled BOOLEAN DEFAULT TRUE COMMENT '是否启用该平台',
  platform_config TEXT COMMENT '平台特定配置JSON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  UNIQUE KEY uk_project_platform (project_id, platform_id),
  INDEX idx_project_id (project_id),
  INDEX idx_platform_id (platform_id),
  
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目平台关联表';

-- 创建统一监控事件表
CREATE TABLE monitor_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  
  -- 基础标识
  project_id VARCHAR(100) NOT NULL COMMENT '项目ID',
  platform_code VARCHAR(50) NOT NULL COMMENT '平台代码',
  event_type ENUM('error', 'performance', 'user_action', 'network', 'custom') NOT NULL COMMENT '事件类型',
  event_subtype VARCHAR(50) NOT NULL COMMENT '事件子类型',
  
  -- 会话信息
  session_id VARCHAR(100) COMMENT '会话ID',
  user_id VARCHAR(100) COMMENT '用户ID',
  device_id VARCHAR(100) COMMENT '设备ID',
  
  -- 上下文信息
  page_url VARCHAR(1000) COMMENT '页面URL',
  referrer_url VARCHAR(1000) COMMENT '来源页面',
  user_agent TEXT COMMENT '用户代理',
  
  -- 环境信息
  app_version VARCHAR(50) COMMENT '应用版本',
  sdk_version VARCHAR(50) COMMENT 'SDK版本',
  framework_version VARCHAR(50) COMMENT '框架版本',
  
  -- 设备和网络信息
  device_info TEXT COMMENT '设备信息JSON',
  network_info TEXT COMMENT '网络信息JSON',
  
  -- 地理位置
  country_code CHAR(2) COMMENT '国家代码',
  region VARCHAR(100) COMMENT '地区',
  city VARCHAR(100) COMMENT '城市',
  
  -- 事件数据
  event_data LONGTEXT NOT NULL COMMENT '事件具体数据JSON',
  extra_data TEXT COMMENT '扩展数据JSON',
  
  -- 时间戳
  event_timestamp BIGINT NOT NULL COMMENT '事件发生时间戳毫秒',
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '服务器接收时间',
  
  -- 处理状态
  is_processed BOOLEAN DEFAULT FALSE COMMENT '是否已处理',
  processed_at DATETIME COMMENT '处理时间',
  data_hash VARCHAR(64) COMMENT '数据哈希用于去重',
  
  INDEX idx_project_event_time (project_id, event_timestamp),
  INDEX idx_platform_event_time (platform_code, event_timestamp),
  INDEX idx_event_type_time (event_type, event_timestamp),
  INDEX idx_session_id (session_id),
  INDEX idx_user_id (user_id),
  INDEX idx_is_processed (is_processed),
  INDEX idx_data_hash (data_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='统一监控事件表';

-- 创建性能指标表
CREATE TABLE performance_metrics (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  
  -- 基础信息
  project_id VARCHAR(100) NOT NULL COMMENT '项目ID',
  platform_code VARCHAR(50) NOT NULL COMMENT '平台代码',
  session_id VARCHAR(100) COMMENT '会话ID',
  user_id VARCHAR(100) COMMENT '用户ID',
  
  -- 性能指标类型
  metric_type ENUM('page_load', 'api_response', 'resource_load', 'user_interaction', 'memory_usage', 'custom') NOT NULL COMMENT '指标类型',
  metric_name VARCHAR(100) NOT NULL COMMENT '指标名称',
  
  -- 页面信息
  page_url VARCHAR(1000) COMMENT '页面URL',
  page_title VARCHAR(255) COMMENT '页面标题',
  
  -- 核心性能指标
  fcp INT COMMENT 'First Contentful Paint毫秒',
  lcp INT COMMENT 'Largest Contentful Paint毫秒',
  fid INT COMMENT 'First Input Delay毫秒',
  cls DECIMAL(10,6) COMMENT 'Cumulative Layout Shift',
  ttfb INT COMMENT 'Time to First Byte毫秒',
  
  -- 页面加载性能
  dom_ready INT COMMENT 'DOM Ready时间毫秒',
  load_complete INT COMMENT '完整页面加载时间毫秒',
  first_paint INT COMMENT '白屏时间毫秒',
  
  -- 资源加载性能
  dns_lookup INT COMMENT 'DNS解析时间毫秒',
  tcp_connect INT COMMENT 'TCP连接时间毫秒',
  ssl_connect INT COMMENT 'SSL握手时间毫秒',
  response_time INT COMMENT '请求响应时间毫秒',
  
  -- API性能
  api_url VARCHAR(1000) COMMENT 'API URL',
  http_method VARCHAR(10) COMMENT 'HTTP方法',
  status_code INT COMMENT '响应状态码',
  request_size INT COMMENT '请求大小字节',
  response_size INT COMMENT '响应大小字节',
  
  -- 内存性能
  memory_used DECIMAL(10,2) COMMENT '已使用内存MB',
  memory_total DECIMAL(10,2) COMMENT '总内存MB',
  memory_usage_percent DECIMAL(5,2) COMMENT '内存使用率百分比',
  
  -- 环境信息
  device_info TEXT COMMENT '设备信息JSON',
  network_info TEXT COMMENT '网络信息JSON',
  user_agent TEXT COMMENT '用户代理',
  
  -- 自定义数据
  custom_metrics TEXT COMMENT '自定义指标数据JSON',
  extra_data TEXT COMMENT '扩展数据JSON',
  
  -- 时间戳
  metric_timestamp BIGINT NOT NULL COMMENT '指标发生时间戳毫秒',
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '服务器接收时间',
  
  -- 统计标识
  data_version VARCHAR(10) DEFAULT '1.0' COMMENT '数据版本',
  is_aggregated BOOLEAN DEFAULT FALSE COMMENT '是否已聚合统计',
  
  INDEX idx_project_metric_time (project_id, metric_timestamp),
  INDEX idx_platform_metric_time (platform_code, metric_timestamp),
  INDEX idx_metric_type_time (metric_type, metric_timestamp),
  INDEX idx_page_url_time (page_url(255), metric_timestamp),
  INDEX idx_is_aggregated (is_aggregated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='性能指标表';

-- 插入默认平台数据
INSERT INTO platforms (platform_code, platform_name, platform_category, description) VALUES
('web', 'Web浏览器', 'web', '支持现代Web浏览器的JavaScript监控'),
('weapp', '微信小程序', 'mobile', '微信小程序监控支持'),
('alipay', '支付宝小程序', 'mobile', '支付宝小程序监控支持'),
('tt', '抖音小程序', 'mobile', '抖音/今日头条小程序监控支持'),
('rn', 'React Native', 'mobile', 'React Native应用监控支持'),
('flutter', 'Flutter', 'mobile', 'Flutter应用监控支持'),
('app', '原生App', 'mobile', 'iOS/Android原生应用监控支持'),
('electron', 'Electron桌面应用', 'desktop', 'Electron桌面应用监控支持'),
('node', 'Node.js服务端', 'server', 'Node.js服务端监控支持'),
('java', 'Java服务端', 'server', 'Java应用服务端监控支持');

-- 创建默认项目
INSERT INTO projects (project_id, project_name, description) VALUES
('demo-project', '演示项目', '用于测试和演示的默认项目');

-- 关联默认项目和平台
INSERT INTO project_platforms (project_id, platform_id, is_enabled) 
SELECT 1, id, TRUE FROM platforms WHERE platform_code IN ('web', 'weapp', 'app');