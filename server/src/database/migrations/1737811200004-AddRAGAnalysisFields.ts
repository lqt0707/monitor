import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddRAGAnalysisFields1704067200000 implements MigrationInterface {
  name = 'AddRAGAnalysisFields1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 为错误日志表添加RAG分析相关字段
    await queryRunner.query(`
      ALTER TABLE error_logs 
      ADD COLUMN rag_analysis_result TEXT NULL COMMENT 'RAG分析结果（JSON格式）',
      ADD COLUMN rag_analysis_generated_at DATETIME NULL COMMENT 'RAG分析生成时间'
    `);

    // 2. 为错误聚合表添加RAG分析相关字段
    await queryRunner.query(`
      ALTER TABLE error_aggregations 
      ADD COLUMN rag_analysis_result TEXT NULL COMMENT 'RAG分析结果（JSON格式）',
      ADD COLUMN rag_analysis_generated_at DATETIME NULL COMMENT 'RAG分析生成时间'
    `);

    // 3. 创建项目索引表
    await queryRunner.createTable(
      new Table({
        name: 'project_indexes',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'project_path',
            type: 'varchar',
            length: '500',
            isUnique: true,
          },
          {
            name: 'project_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'framework',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'total_files',
            type: 'int',
            default: 0,
          },
          {
            name: 'total_chunks',
            type: 'int',
            default: 0,
          },
          {
            name: 'last_indexed_at',
            type: 'datetime',
            isNullable: true,
          },
          {
            name: 'index_status',
            type: 'enum',
            enum: ['pending', 'indexing', 'completed', 'failed'],
            default: "'pending'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // 4. 为项目索引表添加索引
    await queryRunner.createIndex(
      'project_indexes',
      new TableIndex({
        name: 'idx_framework',
        columnNames: ['framework'],
      })
    );

    await queryRunner.createIndex(
      'project_indexes',
      new TableIndex({
        name: 'idx_status',
        columnNames: ['index_status'],
      })
    );

    // 5. 创建代码块表
    await queryRunner.createTable(
      new Table({
        name: 'source_code_chunks',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'function_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'start_line',
            type: 'int',
          },
          {
            name: 'end_line',
            type: 'int',
          },
          {
            name: 'language',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'framework',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'imports',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'exports',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'chunk_type',
            type: 'enum',
            enum: ['function', 'class', 'module', 'component'],
          },
          {
            name: 'project_index_id',
            type: 'int',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // 6. 为代码块表添加索引
    await queryRunner.createIndex(
      'source_code_chunks',
      new TableIndex({
        name: 'idx_file_path',
        columnNames: ['file_path'],
      })
    );

    await queryRunner.createIndex(
      'source_code_chunks',
      new TableIndex({
        name: 'idx_language',
        columnNames: ['language'],
      })
    );

    await queryRunner.createIndex(
      'source_code_chunks',
      new TableIndex({
        name: 'idx_framework',
        columnNames: ['framework'],
      })
    );

    await queryRunner.createIndex(
      'source_code_chunks',
      new TableIndex({
        name: 'idx_chunk_type',
        columnNames: ['chunk_type'],
      })
    );

    await queryRunner.createIndex(
      'source_code_chunks',
      new TableIndex({
        name: 'idx_project_index_id',
        columnNames: ['project_index_id'],
      })
    );

    // 7. 添加外键约束
    await queryRunner.createForeignKey(
      'source_code_chunks',
      new TableForeignKey({
        name: 'fk_source_code_chunks_project_index',
        columnNames: ['project_index_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'project_indexes',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. 删除外键约束
    const sourceCodeChunksTable = await queryRunner.getTable('source_code_chunks');
    const foreignKey = sourceCodeChunksTable.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('project_index_id') !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('source_code_chunks', foreignKey);
    }

    // 2. 删除代码块表
    await queryRunner.dropTable('source_code_chunks');

    // 3. 删除项目索引表
    await queryRunner.dropTable('project_indexes');

    // 4. 删除错误聚合表的RAG分析字段
    await queryRunner.query(`
      ALTER TABLE error_aggregations 
      DROP COLUMN rag_analysis_result,
      DROP COLUMN rag_analysis_generated_at
    `);

    // 5. 删除错误日志表的RAG分析字段
    await queryRunner.query(`
      ALTER TABLE error_logs 
      DROP COLUMN rag_analysis_result,
      DROP COLUMN rag_analysis_generated_at
    `);
  }
}
