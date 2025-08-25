import { PartialType } from '@nestjs/mapped-types';
import { CreateAlertRuleDto } from './create-alert-rule.dto';

/**
 * 更新告警规则DTO
 * 用于更新告警规则时的数据验证，继承自CreateAlertRuleDto但所有字段都是可选的
 */
export class UpdateAlertRuleDto extends PartialType(CreateAlertRuleDto) {}