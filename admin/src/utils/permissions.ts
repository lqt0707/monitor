/**
 * 权限管理工具函数
 * 提供权限检查和角色管理功能
 */

import type { User } from '../types/monitor';

// 权限常量定义
export const PERMISSIONS = {
  // 用户管理权限
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // 项目管理权限
  PROJECT_VIEW: 'project:view',
  PROJECT_CREATE: 'project:create',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_CONFIG: 'project:config',
  
  // 错误监控权限
  ERROR_VIEW: 'error:view',
  ERROR_RESOLVE: 'error:resolve',
  ERROR_DELETE: 'error:delete',
  
  // 系统设置权限
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_LOGS: 'system:logs',
} as const;

// 角色权限映射
export const ROLE_PERMISSIONS = {
  admin: [
    // 管理员拥有所有权限
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.PROJECT_DELETE,
    PERMISSIONS.PROJECT_CONFIG,
    PERMISSIONS.ERROR_VIEW,
    PERMISSIONS.ERROR_RESOLVE,
    PERMISSIONS.ERROR_DELETE,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.SYSTEM_LOGS,
  ],
  user: [
    // 普通用户权限
    PERMISSIONS.PROJECT_VIEW,
    PERMISSIONS.ERROR_VIEW,
    PERMISSIONS.ERROR_RESOLVE,
  ],
} as const;

/**
 * 检查用户是否具有指定权限
 * @param user 用户信息
 * @param permission 权限标识
 * @returns 是否具有权限
 */
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission as any);
};

/**
 * 检查用户是否具有任一权限
 * @param user 用户信息
 * @param permissions 权限列表
 * @returns 是否具有任一权限
 */
export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  
  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * 检查用户是否具有所有权限
 * @param user 用户信息
 * @param permissions 权限列表
 * @returns 是否具有所有权限
 */
export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  
  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * 检查用户角色
 * @param user 用户信息
 * @param role 角色
 * @returns 是否为指定角色
 */
export const hasRole = (user: User | null, role: 'admin' | 'user'): boolean => {
  if (!user) return false;
  return user.role === role;
};

/**
 * 获取用户所有权限
 * @param user 用户信息
 * @returns 权限列表
 */
export const getUserPermissions = (user: User | null): string[] => {
  if (!user) return [];
  return [...(ROLE_PERMISSIONS[user.role] || [])];
};

/**
 * 权限检查装饰器
 * @param permission 权限标识
 * @returns 装饰器函数
 */
export const requirePermission = (permission: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      // 这里可以添加权限检查逻辑
      // 在实际使用中，需要从上下文获取用户信息
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
};