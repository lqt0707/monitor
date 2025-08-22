/**
 * Web监控SDK工具函数
 * 提供通用的工具方法，包括ID生成、时间处理、环境检测等
 */

/**
 * 生成唯一ID
 * @returns 唯一标识符
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 生成会话ID
 * @returns 会话标识符
 */
export function generateSessionId(): string {
  const sessionId = sessionStorage.getItem('monitor_session_id');
  if (sessionId) {
    return sessionId;
  }
  
  const newSessionId = generateId();
  sessionStorage.setItem('monitor_session_id', newSessionId);
  return newSessionId;
}

/**
 * 获取当前时间戳
 * @returns 毫秒时间戳
 */
export function getTimestamp(): number {
  return Date.now();
}

/**
 * 检测是否为开发环境
 * @returns 是否为开发环境
 */
export function isDevelopment(): boolean {
  return location.hostname === 'localhost' ||
         location.hostname === '127.0.0.1' ||
         location.hostname.includes('192.168.') ||
         location.hostname.includes('dev') ||
         location.port === '3000' ||
         location.port === '8080';
}

/**
 * 获取页面URL信息
 * @returns URL信息对象
 */
export function getPageInfo() {
  return {
    url: location.href,
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    host: location.host,
    protocol: location.protocol
  };
}

/**
 * 获取用户代理信息
 * @returns 用户代理字符串
 */
export function getUserAgent(): string {
  return navigator.userAgent;
}

/**
 * 获取浏览器信息
 * @returns 浏览器信息对象
 */
export function getBrowserInfo() {
  const ua = navigator.userAgent;
  const result: any = {
    userAgent: ua,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled
  };

  // 检测浏览器类型
  if (ua.includes('Chrome')) {
    result.browser = 'Chrome';
  } else if (ua.includes('Firefox')) {
    result.browser = 'Firefox';
  } else if (ua.includes('Safari')) {
    result.browser = 'Safari';
  } else if (ua.includes('Edge')) {
    result.browser = 'Edge';
  } else {
    result.browser = 'Unknown';
  }

  // 检测操作系统
  if (ua.includes('Windows')) {
    result.os = 'Windows';
  } else if (ua.includes('Mac')) {
    result.os = 'macOS';
  } else if (ua.includes('Linux')) {
    result.os = 'Linux';
  } else if (ua.includes('Android')) {
    result.os = 'Android';
  } else if (ua.includes('iOS')) {
    result.os = 'iOS';
  } else {
    result.os = 'Unknown';
  }

  return result;
}

/**
 * 获取设备信息
 * @returns 设备信息对象
 */
export function getDeviceInfo() {
  return {
    screenWidth: screen.width,
    screenHeight: screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    colorDepth: screen.colorDepth,
    orientation: screen.orientation?.type || 'unknown'
  };
}

/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  if (typeof obj === 'object') {
    const cloned: any = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone((obj as any)[key]);
    });
    return cloned;
  }
  
  return obj;
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
  let timeout: number;
  
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
 * @param limit 时间限制
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
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 安全的JSON序列化
 * @param obj 要序列化的对象
 * @returns JSON字符串
 */
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      // 处理循环引用
      if (typeof value === 'object' && value !== null) {
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack
          };
        }
      }
      return value;
    });
  } catch (error) {
    return JSON.stringify({ error: 'Failed to stringify object' });
  }
}

/**
 * 获取错误堆栈信息
 * @param error 错误对象
 * @returns 格式化的堆栈信息
 */
export function getErrorStack(error: Error): string {
  if (!error.stack) {
    return '';
  }
  
  // 清理堆栈信息，移除不必要的内容
  return error.stack
    .split('\n')
    .filter(line => line.trim())
    .slice(0, 10) // 只保留前10行
    .join('\n');
}

/**
 * 检查是否支持某个API
 * @param api API名称
 * @returns 是否支持
 */
export function isSupported(api: string): boolean {
  switch (api) {
    case 'fetch':
      return typeof fetch !== 'undefined';
    case 'performance':
      return typeof performance !== 'undefined';
    case 'observer':
      return typeof PerformanceObserver !== 'undefined';
    case 'sendBeacon':
      return typeof navigator.sendBeacon !== 'undefined';
    case 'requestIdleCallback':
      return typeof requestIdleCallback !== 'undefined';
    default:
      return false;
  }
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的大小字符串
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}