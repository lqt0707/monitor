/**
 * 统一配置模块
 * 集中管理所有环境变量和配置
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigHelper } from './config-helper';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development', '.env.production'],
      expandVariables: true,
    }),
  ],
  providers: [ConfigHelper],
  exports: [ConfigHelper],
})
export class ConfigModule {}

export { ConfigHelper } from './config-helper';
export { ConfigKey } from './config-helper';