import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 源代码块实体
 * 存储分块后的源代码片段，用于向量化搜索
 */
@Entity('source_code_chunks')
@Index(['projectId', 'version'])
@Index(['filePath', 'startLine'])
@Index(['chunkHash'], { unique: true })
@Index(['isActive'])
export class SourceCodeChunk {
  /** 主键ID */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 项目ID */
  @Column({ type: 'varchar', length: 100 })
  projectId: string;

  /** 文件路径 */
  @Column({ type: 'varchar', length: 500 })
  filePath: string;

  /** 版本号 */
  @Column({ type: 'varchar', length: 50 })
  version: string;

  /** 代码块内容 */
  @Column({ type: 'text' })
  content: string;

  /** 起始行号 */
  @Column({ type: 'int' })
  startLine: number;

  /** 结束行号 */
  @Column({ type: 'int' })
  endLine: number;

  /** 编程语言 */
  @Column({ type: 'varchar', length: 20, default: 'unknown' })
  language: string;

  /** 代码块哈希值（用于去重） */
  @Column({ type: 'varchar', length: 64 })
  chunkHash: string;

  /** 是否活跃（用于版本控制） */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /** 嵌入向量（可选，如果使用数据库存储向量） */
  @Column({ type: 'text', nullable: true })
  embedding: string;

  /** 元数据（JSON格式） */
  @Column({ type: 'json', nullable: true })
  metadata: any;

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 创建源代码块实例
   */
  static create(params: {
    projectId: string;
    filePath: string;
    version: string;
    content: string;
    startLine: number;
    endLine: number;
    language?: string;
    chunkHash: string;
    metadata?: any;
  }): SourceCodeChunk {
    const chunk = new SourceCodeChunk();
    chunk.projectId = params.projectId;
    chunk.filePath = params.filePath;
    chunk.version = params.version;
    chunk.content = params.content;
    chunk.startLine = params.startLine;
    chunk.endLine = params.endLine;
    chunk.language = params.language || 'unknown';
    chunk.chunkHash = params.chunkHash;
    chunk.metadata = params.metadata || {};
    chunk.isActive = true;
    return chunk;
  }

  /**
   * 获取代码块摘要
   */
  getSummary(): string {
    const lines = this.content.split('\n');
    const preview = lines.length > 3 
      ? lines.slice(0, 3).join('\n') + '...' 
      : this.content;
    
    return `[${this.filePath}:${this.startLine}-${this.endLine}] ${preview}`;
  }

  /**
   * 检查代码块是否包含特定文本
   */
  containsText(text: string): boolean {
    return this.content.toLowerCase().includes(text.toLowerCase());
  }

  /**
   * 获取代码块大小（字符数）
   */
  getSize(): number {
    return this.content.length;
  }

  /**
   * 获取代码块行数
   */
  getLineCount(): number {
    return this.endLine - this.startLine + 1;
  }

  /**
   * 验证代码块是否有效
   */
  isValid(): boolean {
    return !!(this.projectId && this.filePath && this.content && this.chunkHash);
  }
}