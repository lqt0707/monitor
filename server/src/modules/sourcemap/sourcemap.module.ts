import { Module } from '@nestjs/common';
import { SourceMapService } from './services/sourcemap.service';

/**
 * SourceMap模块
 * 提供源码映射解析功能
 */
@Module({
  providers: [SourceMapService],
  exports: [SourceMapService],
})
export class SourcemapModule {}