import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * 源代码版本实体类
 * 用于存储项目的源代码版本信息
 */
@Entity("source_code_versions")
@Index("idx_project_version_timestamp", [
  "projectId",
  "version",
  "uploadTimestamp",
])
@Index("idx_project_created", ["projectId", "createdAt"])
export class SourceCodeVersion {
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
   * 版本号
   */
  @Column({ length: 50 })
  version: string;

  /**
   * 上传时间戳（用于区分同一版本的多次上传）
   */
  @Column({ name: "upload_timestamp", type: "bigint", nullable: true })
  uploadTimestamp?: number;

  /**
   * 构建ID或Git提交哈希
   */
  @Column({ name: "build_id", length: 100, nullable: true })
  buildId?: string;

  /**
   * 分支名称
   */
  @Column({ name: "branch_name", length: 100, nullable: true })
  branchName?: string;

  /**
   * 提交信息
   */
  @Column({ name: "commit_message", type: "text", nullable: true })
  commitMessage?: string;

  /**
   * 源代码存储路径
   */
  @Column({ name: "storage_path", length: 500 })
  storagePath: string;

  /**
   * 压缩包文件名
   */
  @Column({ name: "archive_name", length: 255 })
  archiveName: string;

  /**
   * 压缩包大小（字节）
   */
  @Column({ name: "archive_size", nullable: true })
  archiveSize?: number;

  /**
   * 文件总数
   */
  @Column({ name: "file_count", default: 0 })
  fileCount: number;

  /**
   * 源代码文件列表（JSON格式）
   */
  @Column({ name: "file_list", type: "text", nullable: true })
  fileList?: string;

  /**
   * 上传者
   */
  @Column({ name: "uploaded_by", length: 100, nullable: true })
  uploadedBy?: string;

  /**
   * 描述信息
   */
  @Column({ type: "text", nullable: true })
  description?: string;

  /**
   * 是否为当前活跃版本
   */
  @Column({ name: "is_active", default: false })
  isActive: boolean;

  /**
   * 是否关联了sourcemap文件
   */
  @Column({ name: "has_sourcemap", default: false })
  hasSourcemap: boolean;

  /**
   * 关联的sourcemap版本
   */
  @Column({ name: "sourcemap_version", length: 50, nullable: true })
  sourcemapVersion?: string;

  /**
   * sourcemap关联时间
   */
  @Column({ name: "sourcemap_associated_at", type: "timestamp", nullable: true })
  sourcemapAssociatedAt?: Date;

  /**
   * 创建时间
   */
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
