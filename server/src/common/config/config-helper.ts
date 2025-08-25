/**
 * 配置管理工具
 * 统一管理环境变量和配置
 */

import { ConfigService } from "@nestjs/config";

/**
 * 配置键名枚举
 */
export enum ConfigKey {
  // 应用配置
  APP_PORT = "APP_PORT",
  APP_ENV = "APP_ENV",
  APP_NAME = "APP_NAME",

  // 数据库配置
  MYSQL_HOST = "MYSQL_HOST",
  MYSQL_PORT = "MYSQL_PORT",
  MYSQL_USERNAME = "MYSQL_USERNAME",
  MYSQL_PASSWORD = "MYSQL_PASSWORD",
  MYSQL_DATABASE = "MYSQL_DATABASE",

  CLICKHOUSE_HOST = "CLICKHOUSE_HOST",
  CLICKHOUSE_PORT = "CLICKHOUSE_PORT",
  CLICKHOUSE_USERNAME = "CLICKHOUSE_USERNAME",
  CLICKHOUSE_PASSWORD = "CLICKHOUSE_PASSWORD",
  CLICKHOUSE_DATABASE = "CLICKHOUSE_DATABASE",

  REDIS_HOST = "REDIS_HOST",
  REDIS_PORT = "REDIS_PORT",
  REDIS_PASSWORD = "REDIS_PASSWORD",
  REDIS_DB = "REDIS_DB",

  // 邮件配置
  EMAIL_HOST = "EMAIL_HOST",
  EMAIL_PORT = "EMAIL_PORT",
  EMAIL_USER = "EMAIL_USER",
  EMAIL_PASSWORD = "EMAIL_PASSWORD",
  EMAIL_FROM = "EMAIL_FROM",

  // AI配置
  AI_API_KEY = "AI_API_KEY",
  AI_MODEL = "AI_MODEL",
  AI_BASE_URL = "AI_BASE_URL",

  // JWT配置
  JWT_SECRET = "JWT_SECRET",
  JWT_EXPIRES_IN = "JWT_EXPIRES_IN",

  // 错误处理配置
  ERROR_AGGREGATION_WINDOW = "ERROR_AGGREGATION_WINDOW",
  ERROR_RETENTION_DAYS = "ERROR_RETENTION_DAYS",

  // CORS配置
  CORS_ORIGIN = "CORS_ORIGIN",

  // Swagger配置
  SWAGGER_ENABLED = "SWAGGER_ENABLED",
}

/**
 * 配置辅助类
 */
export class ConfigHelper {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取字符串配置
   * @param key 配置键
   * @param defaultValue 默认值
   * @returns 配置值
   */
  getString(key: ConfigKey, defaultValue?: string): string {
    return this.configService.get<string>(key, defaultValue);
  }

  /**
   * 获取数字配置
   * @param key 配置键
   * @param defaultValue 默认值
   * @returns 配置值
   */
  getNumber(key: ConfigKey, defaultValue?: number): number {
    return this.configService.get<number>(key, defaultValue);
  }

  /**
   * 获取布尔配置
   * @param key 配置键
   * @param defaultValue 默认值
   * @returns 配置值
   */
  getBoolean(key: ConfigKey, defaultValue?: boolean): boolean {
    return this.configService.get<boolean>(key, defaultValue);
  }

  /**
   * 获取数组配置
   * @param key 配置键
   * @param defaultValue 默认值
   * @returns 配置值
   */
  getArray<T>(key: ConfigKey, defaultValue?: T[]): T[] {
    return this.configService.get<T[]>(key, defaultValue);
  }

  /**
   * 获取对象配置
   * @param key 配置键
   * @param defaultValue 默认值
   * @returns 配置值
   */
  getObject<T>(key: ConfigKey, defaultValue?: T): T {
    return this.configService.get<T>(key, defaultValue);
  }

  /**
   * 检查配置是否存在
   * @param key 配置键
   * @returns 是否存在
   */
  has(key: ConfigKey): boolean {
    return this.configService.get(key) !== undefined;
  }

  /**
   * 获取所有配置
   * @returns 所有配置对象
   */
  getAll(): Record<string, any> {
    return {
      // 应用配置
      [ConfigKey.APP_PORT]: this.getNumber(ConfigKey.APP_PORT, 3000),
      [ConfigKey.APP_ENV]: this.getString(ConfigKey.APP_ENV, "development"),
      [ConfigKey.APP_NAME]: this.getString(
        ConfigKey.APP_NAME,
        "monitor-server"
      ),

      // 数据库配置
      [ConfigKey.MYSQL_HOST]: this.getString(ConfigKey.MYSQL_HOST, "localhost"),
      [ConfigKey.MYSQL_PORT]: this.getNumber(ConfigKey.MYSQL_PORT, 3306),
      [ConfigKey.MYSQL_USERNAME]: this.getString(
        ConfigKey.MYSQL_USERNAME,
        "root"
      ),
      [ConfigKey.MYSQL_PASSWORD]: this.getString(ConfigKey.MYSQL_PASSWORD, ""),
      [ConfigKey.MYSQL_DATABASE]: this.getString(
        ConfigKey.MYSQL_DATABASE,
        "monitor"
      ),

      [ConfigKey.CLICKHOUSE_HOST]: this.getString(
        ConfigKey.CLICKHOUSE_HOST,
        "localhost"
      ),
      [ConfigKey.CLICKHOUSE_PORT]: this.getNumber(
        ConfigKey.CLICKHOUSE_PORT,
        8123
      ),
      [ConfigKey.CLICKHOUSE_USERNAME]: this.getString(
        ConfigKey.CLICKHOUSE_USERNAME,
        "default"
      ),
      [ConfigKey.CLICKHOUSE_PASSWORD]: this.getString(
        ConfigKey.CLICKHOUSE_PASSWORD,
        ""
      ),
      [ConfigKey.CLICKHOUSE_DATABASE]: this.getString(
        ConfigKey.CLICKHOUSE_DATABASE,
        "monitor"
      ),

      [ConfigKey.REDIS_HOST]: this.getString(ConfigKey.REDIS_HOST, "localhost"),
      [ConfigKey.REDIS_PORT]: this.getNumber(ConfigKey.REDIS_PORT, 6379),
      [ConfigKey.REDIS_PASSWORD]: this.getString(ConfigKey.REDIS_PASSWORD, ""),
      [ConfigKey.REDIS_DB]: this.getNumber(ConfigKey.REDIS_DB, 0),

      // 邮件配置
      [ConfigKey.EMAIL_HOST]: this.getString(
        ConfigKey.EMAIL_HOST,
        "smtp.gmail.com"
      ),
      [ConfigKey.EMAIL_PORT]: this.getNumber(ConfigKey.EMAIL_PORT, 587),
      [ConfigKey.EMAIL_USER]: this.getString(ConfigKey.EMAIL_USER, ""),
      [ConfigKey.EMAIL_PASSWORD]: this.getString(ConfigKey.EMAIL_PASSWORD, ""),
      [ConfigKey.EMAIL_FROM]: this.getString(ConfigKey.EMAIL_FROM, ""),

      // AI配置
      [ConfigKey.AI_API_KEY]: this.getString(ConfigKey.AI_API_KEY, ""),
      [ConfigKey.AI_MODEL]: this.getString(ConfigKey.AI_MODEL, "gpt-3.5-turbo"),
      [ConfigKey.AI_BASE_URL]: this.getString(
        ConfigKey.AI_BASE_URL,
        "https://api.openai.com"
      ),

      // JWT配置
      [ConfigKey.JWT_SECRET]: this.getString(ConfigKey.JWT_SECRET, "secret"),
      [ConfigKey.JWT_EXPIRES_IN]: this.getString(
        ConfigKey.JWT_EXPIRES_IN,
        "7d"
      ),

      // 错误处理配置
      [ConfigKey.ERROR_AGGREGATION_WINDOW]: this.getNumber(
        ConfigKey.ERROR_AGGREGATION_WINDOW,
        3600
      ),
      [ConfigKey.ERROR_RETENTION_DAYS]: this.getNumber(
        ConfigKey.ERROR_RETENTION_DAYS,
        30
      ),

      // CORS配置
      [ConfigKey.CORS_ORIGIN]: this.getString(ConfigKey.CORS_ORIGIN, "*"),

      // Swagger配置
      [ConfigKey.SWAGGER_ENABLED]: this.getBoolean(
        ConfigKey.SWAGGER_ENABLED,
        true
      ),
    };
  }

  /**
   * 验证配置完整性
   * @param requiredKeys 必需的配置键
   * @throws 如果缺少必需配置
   */
  validateConfig(requiredKeys: ConfigKey[]): void {
    const missingKeys: ConfigKey[] = [];

    for (const key of requiredKeys) {
      if (!this.has(key)) {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length > 0) {
      throw new Error(`缺少必需的配置项: ${missingKeys.join(", ")}`);
    }
  }

  /**
   * 获取数据库连接配置
   */
  getDatabaseConfig() {
    return {
      mysql: {
        host: this.getString(ConfigKey.MYSQL_HOST, "localhost"),
        port: this.getNumber(ConfigKey.MYSQL_PORT, 3306),
        username: this.getString(ConfigKey.MYSQL_USERNAME, "root"),
        password: this.getString(ConfigKey.MYSQL_PASSWORD, ""),
        database: this.getString(ConfigKey.MYSQL_DATABASE, "monitor"),
      },
      clickhouse: {
        host: this.getString(ConfigKey.CLICKHOUSE_HOST, "localhost"),
        port: this.getNumber(ConfigKey.CLICKHOUSE_PORT, 8123),
        username: this.getString(ConfigKey.CLICKHOUSE_USERNAME, "default"),
        password: this.getString(ConfigKey.CLICKHOUSE_PASSWORD, ""),
        database: this.getString(ConfigKey.CLICKHOUSE_DATABASE, "monitor"),
      },
      redis: {
        host: this.getString(ConfigKey.REDIS_HOST, "localhost"),
        port: this.getNumber(ConfigKey.REDIS_PORT, 6379),
        password: this.getString(ConfigKey.REDIS_PASSWORD, ""),
        db: this.getNumber(ConfigKey.REDIS_DB, 0),
      },
    };
  }

  /**
   * 获取邮件配置
   */
  getEmailConfig() {
    return {
      host: this.getString(ConfigKey.EMAIL_HOST, "smtp.gmail.com"),
      port: this.getNumber(ConfigKey.EMAIL_PORT, 587),
      user: this.getString(ConfigKey.EMAIL_USER, ""),
      password: this.getString(ConfigKey.EMAIL_PASSWORD, ""),
      from: this.getString(ConfigKey.EMAIL_FROM, ""),
    };
  }

  /**
   * 获取AI配置
   */
  getAiConfig() {
    return {
      apiKey: this.getString(ConfigKey.AI_API_KEY, ""),
      model: this.getString(ConfigKey.AI_MODEL, "gpt-3.5-turbo"),
      baseUrl: this.getString(ConfigKey.AI_BASE_URL, "https://api.openai.com"),
    };
  }
}
