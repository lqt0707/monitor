import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { SourceCodeVersion } from "./source-code-version.entity";

/**
 * 源代码文件实体类
 * 用于存储具体的源代码文件信息
 */
@Entity("source_code_files")
@Index(["versionId", "filePath"])
@Index(["projectId", "filePath"])
export class SourceCodeFile {
  /**
   * 主键ID
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 版本ID
   */
  @Column({ name: "version_id" })
  versionId: number;

  /**
   * 项目ID
   */
  @Column({ name: "project_id", length: 100 })
  projectId: string;

  /**
   * 文件路径（相对路径）
   */
  @Column({ name: "file_path", length: 500 })
  filePath: string;

  /**
   * 文件名
   */
  @Column({ name: "file_name", length: 255 })
  fileName: string;

  /**
   * 文件类型
   */
  @Column({ name: "file_type", length: 50, nullable: true })
  fileType?: string;

  /**
   * 文件大小（字节）
   */
  @Column({ name: "file_size", nullable: true })
  fileSize?: number;

  /**
   * 文件内容哈希
   */
  @Column({ name: "file_hash", length: 64, nullable: true })
  fileHash?: string;

  /**
   * 源代码内容
   */
  @Column({ name: "source_content", type: "longtext" })
  sourceContent: string;

  /**
   * 是否为源代码文件
   */
  @Column({ name: "is_source_file", default: true })
  isSourceFile: boolean;

  /**
   * 行数
   */
  @Column({ name: "line_count", nullable: true })
  lineCount?: number;

  /**
   * 字符数
   */
  @Column({ name: "char_count", nullable: true })
  charCount?: number;

  /**
   * 创建时间
   */
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  /**
   * 关联的版本信息
   */
  @ManyToOne(() => SourceCodeVersion, { onDelete: "CASCADE" })
  @JoinColumn({ name: "version_id" })
  version: SourceCodeVersion;
}
