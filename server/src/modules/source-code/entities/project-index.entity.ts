import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { SourceCodeChunk } from './source-code-chunk.entity';

@Entity('project_indexes')
export class ProjectIndex {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_path', type: 'varchar', length: 500, unique: true })
  projectPath: string;

  @Column({ name: 'project_name', type: 'varchar', length: 255 })
  projectName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  framework?: string;

  @Column({ name: 'total_files', type: 'int', default: 0 })
  totalFiles: number;

  @Column({ name: 'total_chunks', type: 'int', default: 0 })
  totalChunks: number;

  @Column({ name: 'last_indexed_at', type: 'datetime', nullable: true })
  lastIndexedAt?: Date;

  @Column({ 
    name: 'index_status', 
    type: 'enum', 
    enum: ['pending', 'indexing', 'completed', 'failed'], 
    default: 'pending' 
  })
  indexStatus: 'pending' | 'indexing' | 'completed' | 'failed';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => SourceCodeChunk, chunk => chunk.projectIndex)
  chunks: SourceCodeChunk[];
}
