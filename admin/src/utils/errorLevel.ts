/**
 * 错误级别工具函数
 * 用于处理错误级别的显示和映射
 */

/**
 * 错误级别映射配置
 */
export const ERROR_LEVEL_MAP = {
  1: { text: "低", color: "blue" },
  2: { text: "中", color: "orange" },
  3: { text: "高", color: "red" },
  4: { text: "严重", color: "purple" },
} as const;

/**
 * 获取错误级别信息
 * @param level 错误级别数字
 * @returns 对应的级别信息对象
 */
export const getErrorLevelInfo = (level: number) => {
  return ERROR_LEVEL_MAP[level as keyof typeof ERROR_LEVEL_MAP] || {
    text: "未知",
    color: "default",
  };
};

/**
 * 获取错误级别选项配置（用于Select组件）
 * @returns Select选项数组
 */
export const getErrorLevelOptions = () => {
  return Object.entries(ERROR_LEVEL_MAP).map(([value, config]) => ({
    value,
    label: config.text,
  }));
};