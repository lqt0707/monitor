/**
 * 路由守卫组件
 * 用于保护需要特定权限的路由
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Result, Button } from "antd";
import type { User } from "../types/monitor";
import usePermission from "../hooks/usePermission";

/**
 * 路由守卫属性接口
 */
interface RouteGuardProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 需要的权限 */
  permission?: string;
  /** 需要的权限列表（任一） */
  permissions?: string[];
  /** 是否需要所有权限 */
  requireAll?: boolean;
  /** 需要的角色 */
  role?: "admin" | "user";
  /** 自定义检查函数 */
  customCheck?: (user: User | null) => boolean;
  /** 重定向路径 */
  redirectTo?: string;
}

/**
 * 路由守卫组件
 * @param props 组件属性
 * @returns JSX.Element
 */
const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  customCheck,
  redirectTo = "/dashboard",
}) => {
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    hasPermission: checkPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole: checkRole,
  } = usePermission();

  // 如果未认证，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 自定义检查函数
  if (customCheck && !customCheck(user)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面。"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    );
  }

  // 角色检查
  if (role && !checkRole(role)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle={`此页面需要 ${role === "admin" ? "管理员" : "用户"} 权限。`}
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    );
  }

  // 单个权限检查
  if (permission && !checkPermission(permission)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="您没有权限访问此页面。"
        extra={
          <Button type="primary" onClick={() => window.history.back()}>
            返回上一页
          </Button>
        }
      />
    );
  }

  // 多个权限检查
  if (permissions) {
    const hasRequiredPermissions = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);

    if (!hasRequiredPermissions) {
      return (
        <Result
          status="403"
          title="403"
          subTitle="您没有足够的权限访问此页面。"
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              返回上一页
            </Button>
          }
        />
      );
    }
  }

  // 权限检查通过，渲染子组件
  return <>{children}</>;
};

export default RouteGuard;
