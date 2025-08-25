import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * 创建告警历史记录表的迁移
 */
export class CreateAlertHistoryTable1737811200000 implements MigrationInterface {
  /**
   * 创建告警历史记录表
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'alert_history',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'alert_rule_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'project_config_id',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'triggered_value',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'threshold',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'time_window',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'alert_message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_level',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'triggered'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );



    // 创建索引
    await queryRunner.createIndex(
      'alert_history',
      new TableIndex({
        name: 'IDX_ALERT_HISTORY_PROJECT_CONFIG',
        columnNames: ['project_config_id'],
      }),
    );

    await queryRunner.createIndex(
      'alert_history',
      new TableIndex({
        name: 'IDX_ALERT_HISTORY_ALERT_RULE',
        columnNames: ['alert_rule_id'],
      }),
    );

    await queryRunner.createIndex(
      'alert_history',
      new TableIndex({
        name: 'IDX_ALERT_HISTORY_CREATED_AT',
        columnNames: ['created_at'],
      }),
    );
  }

  /**
   * 删除告警历史记录表
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除外键约束
    const table = await queryRunner.getTable('alert_history');
    const foreignKeys = table.foreignKeys;
    
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey('alert_history', foreignKey);
    }

    // 删除索引
    await queryRunner.dropIndex('alert_history', 'IDX_ALERT_HISTORY_PROJECT_CONFIG');
    await queryRunner.dropIndex('alert_history', 'IDX_ALERT_HISTORY_ALERT_RULE');
    await queryRunner.dropIndex('alert_history', 'IDX_ALERT_HISTORY_CREATED_AT');

    // 删除表
    await queryRunner.dropTable('alert_history');
  }
}