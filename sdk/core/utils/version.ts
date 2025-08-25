/**
 * 版本信息工具
 * 提供版本信息管理和源代码映射相关功能
 */

/**
 * 版本信息接口
 */
export interface VersionInfo {
  /** 项目版本 */
  projectVersion: string;
  /** 构建ID */
  buildId?: string;
  /** 构建时间 */
  buildTime?: string;
  /** 环境 */
  environment?: string;
  /** 是否包含 sourcemap */
  hasSourcemap?: boolean;
  /** 额外信息 */
  extra?: Record<string, string>;
}

/**
 * 创建版本信息
 * @param options 版本信息选项
 * @returns 版本信息对象
 */
export function createVersionInfo(options: Partial<VersionInfo>): VersionInfo {
  const now = new Date();
  
  return {
    projectVersion: options.projectVersion || '0.0.0',
    buildId: options.buildId || generateBuildId(),
    buildTime: options.buildTime || now.toISOString(),
    environment: options.environment || 'production',
    hasSourcemap: options.hasSourcemap || false,
    extra: options.extra || {},
  };
}

/**
 * 生成构建ID
 * 使用时间戳和随机字符串生成唯一的构建ID
 * @returns 构建ID
 */
export function generateBuildId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
}

/**
 * 解析源代码位置
 * 从错误堆栈中提取文件路径、行号、列号
 * @param stack 错误堆栈
 * @returns 源代码位置信息
 */
export function parseSourceLocation(stack: string): { 
  filename?: string; 
  lineno?: number; 
  colno?: number;
} {
  const result: { filename?: string; lineno?: number; colno?: number; } = {};
  
  // 解析堆栈信息
  const stackLines = stack.split("\n");
  
  // 尝试匹配常见的堆栈格式
  for (const line of stackLines) {
    // 跳过第一行，通常是错误消息
    if (line === stackLines[0] && !line.includes('at ') && !line.includes('@')) {
      continue;
    }

    // 尝试匹配 Chrome 格式: "at functionName (file:line:column)"
    const chromeMatch = line.match(/at\s+(?:.+?\s+)?\((.+?):(\d+):(\d+)\)/);
    if (chromeMatch) {
      result.filename = chromeMatch[1];
      result.lineno = parseInt(chromeMatch[2], 10);
      result.colno = parseInt(chromeMatch[3], 10);
      break;
    }

    // 尝试匹配 Chrome 格式的简化版本: "at file:line:column"
    const chromeSimpleMatch = line.match(/at\s+(.+?):(\d+):(\d+)/);
    if (chromeSimpleMatch) {
      result.filename = chromeSimpleMatch[1];
      result.lineno = parseInt(chromeSimpleMatch[2], 10);
      result.colno = parseInt(chromeSimpleMatch[3], 10);
      break;
    }

    // 尝试匹配 Firefox/Safari 格式: "functionName@file:line:column"
    const firefoxMatch = line.match(/(.+?)@(.+?):(\d+):(\d+)/);
    if (firefoxMatch) {
      result.filename = firefoxMatch[2];
      result.lineno = parseInt(firefoxMatch[3], 10);
      result.colno = parseInt(firefoxMatch[4], 10);
      break;
    }

    // 尝试匹配简单的 URL:行号:列号 格式
    const simpleMatch = line.match(/(.+?):(\d+):(\d+)/);
    if (simpleMatch) {
      result.filename = simpleMatch[1];
      result.lineno = parseInt(simpleMatch[2], 10);
      result.colno = parseInt(simpleMatch[3], 10);
      break;
    }
  }
  
  return result;
}

/**
 * 提取错误上下文
 * 从源代码中提取错误行及其上下文
 * @param sourceCode 源代码
 * @param lineNumber 行号
 * @param contextLines 上下文行数
 * @returns 错误上下文
 */
export function extractErrorContext(
  sourceCode: string, 
  lineNumber: number, 
  contextLines: number = 3
): { preLines: string[]; errorLine: string; postLines: string[]; } {
  const lines = sourceCode.split('\n');
  const errorLineIndex = lineNumber - 1; // 转换为0基索引
  
  // 确保行号在有效范围内
  if (errorLineIndex < 0 || errorLineIndex >= lines.length) {
    return {
      preLines: [],
      errorLine: '',
      postLines: []
    };
  }
  
  // 提取错误行
  const errorLine = lines[errorLineIndex];
  
  // 提取前面的行
  const preLines = [];
  for (let i = Math.max(0, errorLineIndex - contextLines); i < errorLineIndex; i++) {
    preLines.push(lines[i]);
  }
  
  // 提取后面的行
  const postLines = [];
  for (let i = errorLineIndex + 1; i < Math.min(lines.length, errorLineIndex + contextLines + 1); i++) {
    postLines.push(lines[i]);
  }
  
  return {
    preLines,
    errorLine,
    postLines
  };
}