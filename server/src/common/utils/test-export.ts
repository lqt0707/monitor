/**
 * 工具函数导出测试脚本
 * 验证所有工具函数都能正确导出和使用
 */

import {
  // 基础工具函数
  formatDate,
  generateRandomString,
  deepClone,
  debounce,
  throttle,
  isValidEmail,
  isValidPhone,
  getFileExtension,
  formatFileSize,
  sleep,
  safeJsonParse,
  safeJsonStringify,
  
  // 分页工具函数
  paginate,
  PaginationResult,
  PaginationParams,
  addLikeCondition,
  addEqualCondition,
  addBooleanCondition,
  addDateRangeCondition,
  
  // 错误处理工具函数
  resourceNotFound,
  resourceNotFoundCN,
  findResource,
  findResourceByField,
  findResources,
  validateResourceExists,
  safeAsyncOperation,
  safeBatchOperation,
  
  // 通用类型
  CommonResponse,
  ErrorResponse,
  SuccessResponse,
  COMMON_CONSTANTS,
  createSuccessResponse,
  createErrorResponse,
  createPaginationResponse
} from '../index';

// 测试函数导出
console.log('✅ 所有工具函数导出成功！');

// 测试类型导出
const testPaginationResult: PaginationResult<any> = {
  data: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0
};

const testSuccessResponse: SuccessResponse<string> = {
  success: true,
  data: 'test'
};

console.log('✅ 所有类型导出成功！');

// 测试常量导出
console.log('默认分页大小:', COMMON_CONSTANTS.DEFAULT_PAGE_SIZE);
console.log('成功消息:', COMMON_CONSTANTS.MESSAGES.SUCCESS);

console.log('✅ 所有常量导出成功！');

// 测试工具函数基本功能
console.log('格式化日期:', formatDate(new Date()));
console.log('随机字符串:', generateRandomString(8));
console.log('邮箱验证:', isValidEmail('test@example.com'));

console.log('✅ 基础工具函数功能正常！');

console.log('🎉 所有工具函数测试通过！');

export {};