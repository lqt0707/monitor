import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { SourceCodeVersion } from './entities/source-code-version.entity';
import { SourceCodeFile } from './entities/source-code-file.entity';
import { SourceCodeVersionService } from './services/source-code-version.service';
import { SourcemapUploadService } from '../sourcemap/services/sourcemap-upload.service';
import { SourceCodeSourcemapIntegrationService } from './services/source-code-sourcemap-integration.service';
import { SourceCodeSourcemapIntegrationController } from './controllers/source-code-sourcemap-integration.controller';
import { ProjectConfigModule } from '../project-config/project-config.module';
import { SourcemapModule } from '../sourcemap/sourcemap.module';

/**
 * 源代码与Sourcemap集成模块
 * 负责管理源代码和sourcemap的关联关系
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([SourceCodeVersion, SourceCodeFile]),
    ProjectConfigModule,
    SourcemapModule,
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      }
    })
  ],
  controllers: [SourceCodeSourcemapIntegrationController],
  providers: [
    SourceCodeVersionService,
    SourcemapUploadService,
    SourceCodeSourcemapIntegrationService
  ],
  exports: [
    SourceCodeSourcemapIntegrationService
  ]
})
export class SourceCodeSourcemapIntegrationModule {}