import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectConfig } from './entities/project-config.entity';
import { ProjectConfigService } from './project-config.service';
import { ProjectConfigController } from './project-config.controller';
import { AlertModule } from '../alert/alert.module';

/**
 * 项目配置模块
 * 负责管理项目配置相关的服务和控制器
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectConfig]),
    forwardRef(() => AlertModule),
  ],
  controllers: [ProjectConfigController],
  providers: [ProjectConfigService],
  exports: [ProjectConfigService], // 导出服务供其他模块使用
})
export class ProjectConfigModule {}