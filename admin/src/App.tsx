/**
 * 应用主入口组件
 * 配置路由和全局状态管理
 */

import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import { store } from "./store";
import ErrorBoundary from "./components/ErrorBoundary";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import ErrorLogs from "./pages/errors/ErrorLogs";
import ErrorAggregations from "./pages/errors/ErrorAggregations";
import ErrorDetail from "./pages/errors/ErrorDetail";
import ProjectManagement from "./pages/projects/ProjectManagement";
import SourceCodeManager from "./pages/source-code/SourceCodeManager";
import UserManagement from "./pages/UserManagement";
import PermissionManagement from "./pages/PermissionManagement";
import StatisticsReport from "./pages/StatisticsReport";
import ChartConfig from "./pages/ChartConfig";
import CustomDashboard from "./pages/CustomDashboard";
import SystemSettings from "./pages/SystemSettings";
import RouteGuard from "./components/RouteGuard";
import { PERMISSIONS } from "./utils/permissions";
import { useAppSelector } from "./hooks/redux";
import { tokenRefreshManager } from "./utils/tokenRefresh";
import "./App.css";

/**
 * 受保护的路由组件
 * 需要用户登录才能访问
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAppSelector((state: any) => state.auth);

  // 启动 token 刷新管理器
  useEffect(() => {
    if (isAuthenticated) {
      tokenRefreshManager.startTokenRefresh();
    } else {
      tokenRefreshManager.stopTokenRefresh();
    }

    // 组件卸载时停止 token 刷新
    return () => {
      tokenRefreshManager.stopTokenRefresh();
    };
  }, [isAuthenticated]);

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

/**
 * 应用主组件
 * @returns JSX.Element
 */

const App: React.FC = () => {
  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === "development"}
      onError={(error, errorInfo) => {
        // 在生产环境中可以发送错误到监控服务
        console.error("Application Error:", error, errorInfo);
      }}
    >
      <Provider store={store}>
        <ConfigProvider locale={zhCN}>
          <Router>
            <Routes>
              {/* 登录页面 */}
              <Route path="/login" element={<Login />} />

              {/* 主应用路由 */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Routes>
                        {/* 默认重定向到仪表盘 */}
                        <Route
                          path="/"
                          element={<Navigate to="/dashboard" replace />}
                        />

                        {/* 仪表盘 */}
                        <Route path="/dashboard" element={<Dashboard />} />

                        {/* 错误监控 */}
                        <Route path="/errors/logs" element={<ErrorLogs />} />
                        <Route
                          path="/errors/aggregations"
                          element={<ErrorAggregations />}
                        />
                        <Route
                          path="/errors/detail/:errorId"
                          element={<ErrorDetail />}
                        />

                        {/* 项目管理 */}
                        <Route
                          path="/projects/list"
                          element={<ProjectManagement />}
                        />
                        
                        {/* 源代码管理 */}
                        <Route
                          path="/source-code"
                          element={<SourceCodeManager />}
                        />

                        {/* 统计报表 */}
                        <Route
                          path="/statistics"
                          element={<StatisticsReport />}
                        />
                        <Route path="/chart-config" element={<ChartConfig />} />
                        <Route
                          path="/custom-dashboard"
                          element={<CustomDashboard />}
                        />
                        <Route path="/settings" element={<SystemSettings />} />

                        <Route
                          path="/users"
                          element={
                            <RouteGuard permission={PERMISSIONS.USER_CREATE}>
                              <UserManagement />
                            </RouteGuard>
                          }
                        />
                        <Route
                          path="/permissions"
                          element={
                            <RouteGuard role="admin">
                              <PermissionManagement />
                            </RouteGuard>
                          }
                        />

                        {/* 404 页面 */}
                        <Route
                          path="*"
                          element={<Navigate to="/dashboard" replace />}
                        />
                      </Routes>
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </ConfigProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
