/**
 * 监控SDK通用工具函数
 * 提供各平台通用的工具方法
 */

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 获取当前时间戳
 * @returns 时间戳
 */
export function getTimestamp(): number {
  return Date.now();
}

/**
 * 生成会话ID
 * @returns 会话ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `session_${timestamp}_${random}`;
}

/**
 * 序列化错误对象
 * @param error 错误对象
 * @returns 序列化后的错误信息
 */
export function serializeError(error: any): any {
  if (!error) return null;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      // 保留其他可能的属性
      ...Object.getOwnPropertyNames(error).reduce((result, key) => {
        if (!["name", "message", "stack"].includes(key)) {
          result[key] = (error as any)[key];
        }
        return result;
      }, {} as any),
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  try {
    return JSON.parse(JSON.stringify(error));
  } catch {
    return { message: String(error) };
  }
}

/**
 * 获取错误堆栈信息
 * @param error 错误对象
 * @returns 堆栈字符串
 */
export function getErrorStack(error: Error): string | undefined {
  if (!error || !error.stack) return undefined;

  // 清理堆栈信息，移除一些不必要的信息
  return error.stack
    .split("\n")
    .filter((line) => line.trim())
    .slice(0, 20) // 限制堆栈深度
    .join("\n");
}

/**
 * 安全的JSON序列化
 * @param obj 要序列化的对象
 * @param maxDepth 最大深度，默认10
 * @returns 序列化结果
 */
export function safeJsonStringify(obj: any, maxDepth: number = 10): string {
  const seen = new WeakSet();

  function replacer(key: string, value: any, depth: number = 0): any {
    // 深度限制
    if (depth > maxDepth) {
      return "[Max Depth Reached]";
    }

    if (value === null || value === undefined) {
      return value;
    }

    // 处理循环引用
    if (typeof value === "object") {
      if (seen.has(value)) {
        return "[Circular Reference]";
      }
      seen.add(value);
    }

    // 处理不同类型的值
    if (value instanceof Error) {
      return serializeError(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (value instanceof RegExp) {
      return value.toString();
    }

    if (typeof value === "function") {
      return "[Function]";
    }

    if (typeof value === "symbol") {
      return value.toString();
    }

    // 处理对象和数组
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return value.map((item, index) =>
          replacer(String(index), item, depth + 1)
        );
      } else {
        const result: any = {};
        for (const k in value) {
          if (value.hasOwnProperty(k)) {
            result[k] = replacer(k, value[k], depth + 1);
          }
        }
        return result;
      }
    }

    return value;
  }

  try {
    const processed = replacer("", obj);
    return JSON.stringify(processed);
  } catch (error) {
    return JSON.stringify({
      error: "Serialization failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * 安全的JSON解析
 * @param str JSON字符串
 * @param defaultValue 默认值
 * @returns 解析结果
 */
export function safeJsonParse<T = any>(
  str: string,
  defaultValue: T | null = null
): T | null {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param limit 限制时间
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 获取当前页面信息（通用）
 * @returns 页面信息
 */
export function getPageInfo(): {
  url: string;
  title: string;
  referrer: string;
} {
  if (typeof globalThis !== "undefined") {
    // 检查是否在Web环境
    if (
      typeof globalThis.location !== "undefined" &&
      typeof globalThis.document !== "undefined"
    ) {
      return {
        url: globalThis.location.href,
        title: globalThis.document.title,
        referrer: globalThis.document.referrer,
      };
    }
  }

  // 其他环境返回默认值
  return {
    url: "",
    title: "",
    referrer: "",
  };
}

/**
 * 获取用户代理信息
 * @returns 用户代理字符串
 */
export function getUserAgent(): string {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.navigator !== "undefined"
  ) {
    return globalThis.navigator.userAgent;
  }
  return "";
}

/**
 * 检查是否为移动设备
 * @returns 是否为移动设备
 */
export function isMobile(): boolean {
  const userAgent = getUserAgent();
  return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    userAgent
  );
}

/**
 * 获取网络连接类型（如果支持）
 * @returns 网络连接类型
 */
export function getNetworkType(): string {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.navigator !== "undefined" &&
    "connection" in globalThis.navigator
  ) {
    const connection = (globalThis.navigator as any).connection;
    return connection.effectiveType || connection.type || "unknown";
  }
  return "unknown";
}

/**
 * 格式化字节大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 格式化持续时间
 * @param ms 毫秒数
 * @returns 格式化后的字符串
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item)) as any;
  }

  if (typeof obj === "object") {
    const cloned = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }

  return obj;
}

/**
 * 检查值是否为空
 * @param value 要检查的值
 * @returns 是否为空
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && Object.keys(value).length === 0) return true;
  return false;
}

/**
 * 获取对象的类型
 * @param obj 对象
 * @returns 类型字符串
 */
export function getType(obj: any): string {
  return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
}

/**
 * 安全地访问对象属性
 * @param obj 对象
 * @param path 属性路径，如 'a.b.c'
 * @param defaultValue 默认值
 * @returns 属性值或默认值
 */
export function get(
  obj: any,
  path: string,
  defaultValue: any = undefined
): any {
  const keys = path.split(".");
  let result = obj;

  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== "object") {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== undefined ? result : defaultValue;
}
