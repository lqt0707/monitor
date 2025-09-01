-- 为错误日志表添加RAG分析相关字段
ALTER TABLE error_logs 
ADD COLUMN rag_analysis_result TEXT NULL COMMENT 'RAG分析结果（JSON格式）',
ADD COLUMN rag_analysis_generated_at DATETIME NULL COMMENT 'RAG分析生成时间';

-- 为错误聚合表添加RAG分析相关字段
ALTER TABLE error_aggregations 
ADD COLUMN rag_analysis_result TEXT NULL COMMENT 'RAG分析结果（JSON格式）',
ADD COLUMN rag_analysis_generated_at DATETIME NULL COMMENT 'RAG分析生成时间';

-- 创建代码块表
CREATE TABLE source_code_chunks (
  id VARCHAR(255) PRIMARY KEY,
  file_path VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  function_name VARCHAR(255) NULL,
  start_line INT NOT NULL,
  end_line INT NOT NULL,
  language VARCHAR(50) NOT NULL,
  framework VARCHAR(50) NULL,
  imports JSON NULL,
  exports JSON NULL,
  chunk_type ENUM('function', 'class', 'module', 'component') NOT NULL,
  project_index_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_file_path (file_path),
  INDEX idx_language (language),
  INDEX idx_framework (framework),
  INDEX idx_chunk_type (chunk_type),
  INDEX idx_project_index_id (project_index_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建项目索引表
CREATE TABLE project_indexes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_path VARCHAR(500) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  framework VARCHAR(50) NULL,
  total_files INT DEFAULT 0,
  total_chunks INT DEFAULT 0,
  last_indexed_at TIMESTAMP NULL,
  index_status ENUM('pending', 'indexing', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY uk_project_path (project_path),
  INDEX idx_framework (framework),
  INDEX idx_status (index_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加外键约束
ALTER TABLE source_code_chunks 
ADD CONSTRAINT fk_source_code_chunks_project_index 
FOREIGN KEY (project_index_id) REFERENCES project_indexes(id) ON DELETE CASCADE;
