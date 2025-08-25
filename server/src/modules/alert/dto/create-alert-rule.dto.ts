import { IsEnum, IsNumber, IsString, IsBoolean, IsOptional, IsArray, Validate, Min, Max } from 'class-validator';
import { AlertRuleType, AlertActionType } from '../entities/alert-rule.entity';
import { Type } from 'class-transformer';

/**
 * 创建告警规则DTO
 * 用于创建告警规则时的数据验证
 */
export class CreateAlertRuleDto {
  /**
   * 规则名称
   */
  @IsString()
  @IsOptional()
  name: string;

  /**
   * 规则类型
   */
  @IsEnum(AlertRuleType)
  type: AlertRuleType;

  /**
   * 规则描述
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * 触发条件
   */
  @IsString()
  condition: string;

  /**
   * 阈值
   */
  @IsNumber()
  @Min(0)
  threshold: number;

  /**
   * 时间窗口（秒）
   */
  @IsNumber()
  @Min(60) // 最小1分钟
  @Max(86400) // 最大24小时
  timeWindow: number;

  /**
   * 告警动作
   */
  @IsArray()
  @IsEnum(AlertActionType, { each: true })
  actions: AlertActionType[];

  /**
   * Webhook URL（可选）
   */
  @IsString()
  @IsOptional()
  webhookUrl?: string;

  /**
   * 是否启用
   */
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  /**
   * 项目ID
   */
  @IsString()
  projectId: string;
}