/**
 * 队列名称常量
 */
export const QUEUE_NAMES = {
  ERROR_PROCESSING: 'error-processing',
  AI_DIAGNOSIS: 'ai-diagnosis',
  EMAIL_NOTIFICATION: 'email-notification',
  SOURCEMAP_PROCESSING: 'sourcemap-processing',
  ERROR_AGGREGATION: 'error-aggregation',
} as const;

/**
 * 任务类型常量
 */
export const JOB_TYPES = {
  // 错误处理队列任务
  PROCESS_ERROR: 'process-error',
  CALCULATE_ERROR_HASH: 'calculate-error-hash',
  UPDATE_AGGREGATION: 'update-aggregation',
  
  // AI诊断队列任务
  ANALYZE_ERROR: 'analyze-error',
  GENERATE_FIX_SUGGESTION: 'generate-fix-suggestion',
  
  // 邮件通知队列任务
  SEND_ALERT_EMAIL: 'send-alert-email',
  SEND_SUMMARY_EMAIL: 'send-summary-email',
  
  // SourceMap处理队列任务
  PARSE_SOURCEMAP: 'parse-sourcemap',
  MAP_ERROR_LOCATION: 'map-error-location',
  
  // 错误聚合队列任务
  AGGREGATE_ERRORS: 'aggregate-errors',
  CLEANUP_OLD_ERRORS: 'cleanup-old-errors',
} as const;

/**
 * 队列优先级
 */
export const JOB_PRIORITIES = {
  CRITICAL: 10,  // 关键错误，立即处理
  HIGH: 5,       // 高优先级
  NORMAL: 0,     // 普通优先级
  LOW: -5,       // 低优先级
} as const;

/**
 * 队列配置选项
 */
export const QUEUE_OPTIONS = {
  [QUEUE_NAMES.ERROR_PROCESSING]: {
    defaultJobOptions: {
      removeOnComplete: 200,
      removeOnFail: 100,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    },
    settings: {
      stalledInterval: 30 * 1000,
      maxStalledCount: 1,
    },
  },
  
  [QUEUE_NAMES.AI_DIAGNOSIS]: {
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 25,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      delay: 2000, // 延迟2秒执行，避免频繁调用AI接口
    },
    settings: {
      stalledInterval: 60 * 1000,
      maxStalledCount: 1,
    },
  },
  
  [QUEUE_NAMES.EMAIL_NOTIFICATION]: {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
    },
    settings: {
      stalledInterval: 30 * 1000,
      maxStalledCount: 2,
    },
  },
  
  [QUEUE_NAMES.SOURCEMAP_PROCESSING]: {
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 25,
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 2000,
      },
    },
    settings: {
      stalledInterval: 45 * 1000,
      maxStalledCount: 1,
    },
  },
  
  [QUEUE_NAMES.ERROR_AGGREGATION]: {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
    settings: {
      stalledInterval: 60 * 1000,
      maxStalledCount: 1,
    },
  },
} as const;