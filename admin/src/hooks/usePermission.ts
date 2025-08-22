/**
 * 权限检查 Hook
 * 提供便捷的权限检查功能
 */

import { useAppSelector } from './redux';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  getUserPermissions,
} from '../utils/permissions';
import type { User } from '../types/monitor';
import type { RootState } from '../store';

/**
 * 权限检查 Hook 返回值接口
 */
export interface UsePermissionReturn {
  /** 当前用户 */
  user: User | null;
  /** 是否已认证 */
  isAuthenticated: boolean;
  /** 是否为管理员 */
  isAdmin: boolean;
  /** 用户权限列表 */
  permissions: string[];
  /** 检查是否拥有指定权限 */
  hasPermission: (permission: string) => boolean;
  /** 检查是否拥有任意一个权限 */
  hasAnyPermission: (permissions: string[]) => boolean;
  /** 检查是否拥有所有权限 */
  hasAllPermissions: (permissions: string[]) => boolean;
  /** 检查是否拥有指定角色 */
  hasRole: (role: string) => boolean;
}

/**
 * 权限检查 Hook
 * @returns UsePermissionReturn
 */
export const usePermission = (): UsePermissionReturn => {
  const { user, isAuthenticated } = useAppSelector((state: RootState) => state.auth);
  
  // 获取用户权限
  const permissions = user ? getUserPermissions(user.role as 'admin' | 'user') : [];
  
  // 是否为管理员
  const isAdmin = user?.role === 'admin';
  
  return {
    user,
    isAuthenticated,
    isAdmin,
    permissions,
    hasPermission: (permission: string) => hasPermission(user, permission),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: string[]) => hasAllPermissions(user, permissions),
    hasRole: (role: string) => hasRole(user, role as 'admin' | 'user'),
  };
};

export default usePermission;