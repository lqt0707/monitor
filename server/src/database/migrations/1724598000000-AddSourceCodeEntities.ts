import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class AddSourceCodeEntities1724598000000 implements MigrationInterface {
  name = 'AddSourceCodeEntities1724598000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 创建 source_code_versions 表
    await queryRunner.createTable(
      new Table({
        name: 'source_code_versions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'project_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'version',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'build_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'branch_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'commit_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'archive_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'archive_size',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'file_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'storage_path',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'uploaded_by',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_SOURCE_CODE_VERSION_PROJECT',
            columnNames: ['project_id'],
          },
          {
            name: 'IDX_SOURCE_CODE_VERSION_PROJECT_VERSION',
            columnNames: ['project_id', 'version'],
          },
          {
            name: 'IDX_SOURCE_CODE_VERSION_ACTIVE',
            columnNames: ['project_id', 'is_active'],
          },
        ],
      }),
      true
    );

    // 创建 source_code_files 表
    await queryRunner.createTable(
      new Table({
        name: 'source_code_files',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'version_id',
            type: 'int',
          },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'file_type',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'file_size',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'content_hash',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_SOURCE_CODE_FILE_VERSION',
            columnNames: ['version_id'],
          },
          {
            name: 'IDX_SOURCE_CODE_FILE_PATH',
            columnNames: ['version_id', 'file_path'],
          },
          {
            name: 'IDX_SOURCE_CODE_FILE_TYPE',
            columnNames: ['file_type'],
          },
        ],
        foreignKeys: [
          {
            columnNames: ['version_id'],
            referencedTableName: 'source_code_versions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    // 为 error_logs 表添加新的源代码关联字段
    const errorLogsTable = await queryRunner.getTable('error_logs');
    if (errorLogsTable) {
      // 检查字段是否已存在，如果不存在则添加
      const existingColumns = errorLogsTable.columns.map(col => col.name);
      
      if (!existingColumns.includes('project_version')) {
        await queryRunner.query(`ALTER TABLE error_logs ADD COLUMN project_version VARCHAR(100) NULL`);
      }
      if (!existingColumns.includes('build_id')) {
        await queryRunner.query(`ALTER TABLE error_logs ADD COLUMN build_id VARCHAR(255) NULL`);
      }
      if (!existingColumns.includes('git_commit')) {
        await queryRunner.query(`ALTER TABLE error_logs ADD COLUMN git_commit VARCHAR(255) NULL`);
      }
      if (!existingColumns.includes('build_time')) {
        await queryRunner.query(`ALTER TABLE error_logs ADD COLUMN build_time TIMESTAMP NULL`);
      }
      if (!existingColumns.includes('original_source_file')) {
        await queryRunner.query(`ALTER TABLE error_logs ADD COLUMN original_source_file VARCHAR(500) NULL`);
      }
      if (!existingColumns.includes('original_source_line')) {
        await queryRunner.query(`ALTER TABLE error_logs ADD COLUMN original_source_line INT NULL`);
      }
      if (!existingColumns.includes('original_source_column')) {
        await queryRunner.query(`ALTER TABLE error_logs ADD COLUMN original_source_column INT NULL`);
      }
      if (!existingColumns.includes('sourcemap_resolved')) {
        await queryRunner.query(`ALTER TABLE error_logs ADD COLUMN sourcemap_resolved BOOLEAN DEFAULT FALSE`);
      }
      if (!existingColumns.includes('source_code_context')) {
        await queryRunner.query(`ALTER TABLE error_logs ADD COLUMN source_code_context TEXT NULL`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除 source_code_files 表
    await queryRunner.dropTable('source_code_files');
    
    // 删除 source_code_versions 表
    await queryRunner.dropTable('source_code_versions');

    // 从 error_logs 表中删除新添加的字段
    const errorLogsTable = await queryRunner.getTable('error_logs');
    if (errorLogsTable) {
      const columnsToRemove = [
        'project_version',
        'build_id', 
        'git_commit',
        'build_time',
        'original_source_file',
        'original_source_line',
        'original_source_column',
        'sourcemap_resolved',
        'source_code_context'
      ];

      for (const columnName of columnsToRemove) {
        const column = errorLogsTable.findColumnByName(columnName);
        if (column) {
          await queryRunner.dropColumn('error_logs', column);
        }
      }
    }
  }
}