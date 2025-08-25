import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { ProjectConfigModule } from '../project-config/project-config.module';
import { SourceMapService } from './services/sourcemap.service';
import { SourcemapUploadService } from './services/sourcemap-upload.service';
import { SourcemapFileManagerService } from './services/sourcemap-file-manager.service';
import { SourcemapCleanupService } from './services/sourcemap-cleanup.service';
import { SourcemapUploadController } from './controllers/sourcemap-upload.controller';
import { SourcemapCleanupController } from './controllers/sourcemap-cleanup.controller';

/**
 * SourceMap模块
 * 提供源码映射解析和文件上传功能
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    ProjectConfigModule
  ],
  controllers: [SourcemapUploadController, SourcemapCleanupController],
  providers: [
    SourceMapService, 
    SourcemapUploadService,
    SourcemapFileManagerService,
    SourcemapCleanupService
  ],
  exports: [
    SourceMapService, 
    SourcemapUploadService,
    SourcemapFileManagerService,
    SourcemapCleanupService
  ],
})
export class SourcemapModule {}