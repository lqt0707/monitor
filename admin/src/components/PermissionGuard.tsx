/**
 * 权限守卫组件
 * 根据用户权限控制组件的显示和隐藏
 */

import React from "react";
import { usePermission } from "../hooks/usePermission";
import type { User } from "../types/monitor";

/**
 * 权限守卫组件 Props
 */
interface PermissionGuardProps {
  children: React.ReactNode;
  // 单个权限检查
  permission?: string;
  // 多个权限检查
  permissions?: string[];
  // 是否需要所有权限
  requireAll?: boolean;
  // 角色检查
  role?: "admin" | "user";
  // 无权限时的回退内容
  fallback?: React.ReactNode;
  // 自定义权限检查函数
  customCheck?: (user: User | null) => boolean;
}

/**
 * 权限守卫组件
 * 根据用户权限决定是否渲染子组件
 * @param props 组件属性
 * @returns JSX.Element | null
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  fallback = null,
  customCheck,
}) => {
  const {
    user,
    hasPermission: checkPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole: checkRole,
  } = usePermission();

  // 自定义检查函数
  if (customCheck) {
    return customCheck(user) ? <>{children}</> : <>{fallback}</>;
  }

  // 角色检查
  if (role && !checkRole(role)) {
    return <>{fallback}</>;
  }

  // 单个权限检查
  if (permission && !checkPermission(permission)) {
    return <>{fallback}</>;
  }

  // 多个权限检查
  if (permissions) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};

export default PermissionGuard;
