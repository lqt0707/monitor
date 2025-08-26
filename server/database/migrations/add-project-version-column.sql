-- 添加 project_version 字段到 monitor_data 表
ALTER TABLE monitor_data ADD COLUMN project_version VARCHAR(50) NULL;

-- 添加索引以提高查询性能
CREATE INDEX idx_monitor_data_project_version ON monitor_data(project_version);
CREATE INDEX idx_monitor_data_project_id_version ON monitor_data(project_id, project_version);