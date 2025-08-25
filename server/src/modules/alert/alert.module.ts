import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertRule } from './entities/alert-rule.entity';
import { AlertHistory } from './entities/alert-history.entity';
import { AlertRuleService } from './services/alert-rule.service';
import { AlertHistoryService } from './services/alert-history.service';
import { SourceCodeService } from './services/source-code.service';
import { AlertRuleController } from './controllers/alert-rule.controller';
import { AlertHistoryController } from './controllers/alert-history.controller';
import { SourceCodeController } from './controllers/source-code.controller';
import { ProjectConfigModule } from '../project-config/project-config.module';

/**
 * 告警模块
 * 整合告警规则相关的实体、服务和控制器
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([AlertRule, AlertHistory]),
    forwardRef(() => ProjectConfigModule),
  ],
  providers: [AlertRuleService, AlertHistoryService, SourceCodeService],
  controllers: [AlertRuleController, AlertHistoryController, SourceCodeController],
  exports: [AlertRuleService, AlertHistoryService, SourceCodeService],
})
export class AlertModule {}