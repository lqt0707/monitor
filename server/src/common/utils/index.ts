/**
 * 通用工具函数库
 * 包含项目中常用的工具函数
 */

/**
 * 日期格式化工具函数
 * @param date 日期对象或日期字符串
 * @param format 格式化字符串，默认：'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string, format = 'YYYY-MM-DD HH:mm:ss'): string {
  const d = new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 生成随机字符串
 * @param length 字符串长度，默认：16
 * @returns 随机字符串
 */
export function generateRandomString(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
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
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  
  return obj;
}

/**
 * 防抖函数
 * @param func 要执行的函数
 * @param delay 延迟时间（毫秒），默认：300
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 节流函数
 * @param func 要执行的函数
 * @param delay 延迟时间（毫秒），默认：300
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    func.apply(this, args);
  };
}

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证手机号格式
 * @param phone 手机号码
 * @returns 是否有效
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * 文件大小格式化
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 睡眠函数
 * @param ms 毫秒数
 * @returns Promise
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 安全的JSON解析
 * @param text JSON字符串
 * @param defaultValue 默认值
 * @returns 解析后的对象或默认值
 */
export function safeJsonParse<T>(text: string, defaultValue: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 安全的JSON字符串化
 * @param value 要字符串化的值
 * @returns JSON字符串或空字符串
 */
export function safeJsonStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

// 导出分页工具函数
export * from './pagination.utils';

// 导出错误处理工具函数
export * from './error.utils';