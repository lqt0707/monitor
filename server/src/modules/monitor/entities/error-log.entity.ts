import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * 错误日志实体类（存储在ClickHouse中的结构定义）
 */
@Entity("error_logs")
@Index(["projectId", "createdAt"])
@Index(["type", "createdAt"])
export class ErrorLog {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 项目ID
   */
  @Column({ name: "project_id", length: 100 })
  projectId: string;

  /**
   * 错误类型
   */
  @Column({ length: 50 })
  type: string;

  /**
   * 错误哈希（用于聚合）
   */
  @Column({ name: "error_hash", length: 1024 })
  errorHash: string;

  /**
   * 错误消息
   */
  @Column({ name: "error_message", type: "text" })
  errorMessage: string;

  /**
   * 错误堆栈
   */
  @Column({ name: "error_stack", type: "text", nullable: true })
  errorStack?: string;

  /**
   * 页面URL
   */
  @Column({ name: "page_url", length: 500, nullable: true })
  pageUrl?: string;

  /**
   * 用户ID
   */
  @Column({ name: "user_id", length: 100, nullable: true })
  userId?: string;

  /**
   * 用户代理
   */
  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent?: string;

  /**
   * 设备信息（JSON字符串）
   */
  @Column({ name: "device_info", type: "text", nullable: true })
  deviceInfo?: string;

  /**
   * 网络信息（JSON字符串）
   */
  @Column({ name: "network_info", type: "text", nullable: true })
  networkInfo?: string;

  /**
   * 性能数据（JSON字符串）
   */
  @Column({ name: "performance_data", type: "text", nullable: true })
  performanceData?: string;

  /**
   * 请求URL（用于网络错误）
   */
  @Column({ name: "request_url", length: 500, nullable: true })
  requestUrl?: string;

  /**
   * 请求方法
   */
  @Column({ name: "request_method", length: 10, nullable: true })
  requestMethod?: string;

  /**
   * 响应状态码
   */
  @Column({ name: "response_status", nullable: true })
  responseStatus?: number;

  /**
   * 请求耗时（毫秒）
   */
  @Column({ nullable: true })
  duration?: number;

  /**
   * 源文件名
   */
  @Column({ name: "source_file", length: 255, nullable: true })
  sourceFile?: string;

  /**
   * 源代码行号
   */
  @Column({ name: "source_line", nullable: true })
  sourceLine?: number;

  /**
   * 源代码列号
   */
  @Column({ name: "source_column", nullable: true })
  sourceColumn?: number;

  /**
   * 项目版本号
   */
  @Column({ name: "project_version", length: 50, nullable: true })
  projectVersion?: string;

  /**
   * 构建ID或Git提交哈希
   */
  @Column({ name: "build_id", length: 100, nullable: true })
  buildId?: string;

  /**
   * 原始源文件路径（未压缩前的路径）
   */
  @Column({ name: "original_source_file", length: 500, nullable: true })
  originalSourceFile?: string;

  /**
   * 原始源代码行号（sourcemap映射后的行号）
   */
  @Column({ name: "original_source_line", nullable: true })
  originalSourceLine?: number;

  /**
   * 原始源代码列号（sourcemap映射后的列号）
   */
  @Column({ name: "original_source_column", nullable: true })
  originalSourceColumn?: number;

  /**
   * 函数名称
   */
  @Column({ name: "function_name", length: 255, nullable: true })
  functionName?: string;

  /**
   * 源代码片段（错误位置前后的代码）
   */
  @Column({ name: "source_snippet", type: "text", nullable: true })
  sourceSnippet?: string;

  /**
   * sourcemap文件路径
   */
  @Column({ name: "sourcemap_path", length: 500, nullable: true })
  sourcemapPath?: string;

  /**
   * 是否已解析源代码位置
   */
  @Column({ name: "is_source_resolved", default: false })
  isSourceResolved: boolean;

  /**
   * AI诊断结果
   */
  @Column({ name: "ai_diagnosis", type: "text", nullable: true })
  aiDiagnosis?: string;

  /**
   * 综合分析报告（JSON格式）
   * 包含错误根本原因、代码定位、修复建议等完整分析
   */
  @Column({ name: "comprehensive_analysis_report", type: "text", nullable: true })
  comprehensiveAnalysisReport?: string;

  /**
   * 综合分析报告生成时间
   */
  @Column({ name: "comprehensive_analysis_generated_at", type: "datetime", nullable: true })
  comprehensiveAnalysisGeneratedAt?: Date;

  /**
   * 综合分析报告版本
   */
  @Column({ name: "comprehensive_analysis_version", length: 50, nullable: true })
  comprehensiveAnalysisVersion?: string;

  /**
   * 错误级别
   */
  @Column({ name: "error_level", default: 1 })
  errorLevel: number;

  /**
   * 是否已处理
   */
  @Column({ name: "is_processed", default: false })
  isProcessed: boolean;

  /**
   * 额外数据（JSON格式）
   */
  @Column({ name: "extra_data", type: "text", nullable: true })
  extraData?: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
