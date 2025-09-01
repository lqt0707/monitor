import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProjectIndex } from './project-index.entity';

@Entity('source_code_chunks')
export class SourceCodeChunk {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ name: 'file_path', type: 'varchar', length: 500 })
  filePath: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'function_name', type: 'varchar', length: 255, nullable: true })
  functionName?: string;

  @Column({ name: 'start_line', type: 'int' })
  startLine: number;

  @Column({ name: 'end_line', type: 'int' })
  endLine: number;

  @Column({ type: 'varchar', length: 50 })
  language: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  framework?: string;

  @Column({ type: 'text', nullable: true })
  imports?: string;

  @Column({ type: 'text', nullable: true })
  exports?: string;

  @Column({ name: 'chunk_type', type: 'enum', enum: ['function', 'class', 'module', 'component'] })
  chunkType: 'function' | 'class' | 'module' | 'component';

  @Column({ name: 'project_index_id', type: 'int' })
  projectIndexId: number;

  @ManyToOne(() => ProjectIndex, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_index_id' })
  projectIndex: ProjectIndex;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
