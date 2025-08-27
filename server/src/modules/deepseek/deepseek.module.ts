import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeepSeekService } from './deepseek.service';
import { DeepSeekController } from './deepseek.controller';

/**
 * DeepSeek AI模块
 * 提供基于DeepSeek的AI错误分析和源代码搜索功能
 */
@Module({
  imports: [ConfigModule],
  controllers: [DeepSeekController],
  providers: [DeepSeekService],
  exports: [DeepSeekService],
})
export class DeepSeekModule {}