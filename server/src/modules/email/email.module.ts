import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailController } from './email.controller';
import { EmailService } from './services/email.service';
import { ProjectConfig } from '../project-config/entities/project-config.entity';

/**
 * 邮件模块
 * 提供邮件发送相关的功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ProjectConfig]),
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}