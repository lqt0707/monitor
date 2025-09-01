/**
 * 主布局组件
 * 提供应用的主要布局结构，包含导航栏、侧边栏和内容区域
 */

import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, theme } from "antd";
import type { MenuProps } from "antd";
import {
  DashboardOutlined,
  BugOutlined,
  SettingOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProjectOutlined,
  SafetyOutlined,
  BarChartOutlined,
  PieChartOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import UserStatus from "../components/UserStatus";
import ResponsiveHeader from "../components/ResponseHeader/ResponsiveHeader";
import "../styles/enhanced-ui.css";

const { Header, Sider, Content } = Layout;

/**
 * 侧边栏菜单项配置
 */
const menuItems: MenuProps["items"] = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "仪表盘",
  },
  {
    key: "/errors",
    icon: <BugOutlined />,
    label: "错误监控",
    children: [
      {
        key: "/errors/logs",
        label: "错误日志",
      },
      {
        key: "/errors/aggregations",
        label: "错误聚合",
      },
    ],
  },
  {
    key: "/projects",
    icon: <ProjectOutlined />,
    label: "项目管理",
    children: [
      {
        key: "/projects/list",
        label: "项目列表",
      },
      {
        key: "/source-code",
        label: "源代码管理",
      },
      {
        key: "/source-code-sourcemap-integration",
        label: "源码映射集成",
      },
    ],
  },
  {
    key: "/statistics",
    icon: <BarChartOutlined />,
    label: "统计报表",
  },
  {
    key: "/chart-config",
    icon: <PieChartOutlined />,
    label: "图表配置",
  },
  {
    key: "/custom-dashboard",
    icon: <AppstoreOutlined />,
    label: "自定义仪表板",
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "系统设置",
    children: [
      {
        key: "/users",
        icon: <UserOutlined />,
        label: "用户管理",
      },
      {
        key: "/permissions",
        icon: <SafetyOutlined />,
        label: "权限管理",
      },
    ],
  },
];

/**
 * 主布局组件 Props 接口
 */
interface MainLayoutProps {
  children?: React.ReactNode;
}

/**
 * 主布局组件
 * @returns JSX.Element
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * 处理菜单点击事件
   * @param key 菜单项的 key
   */
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  /**
   * 处理响应式头部菜单点击
   * @param key 菜单项的 key
   */
  const handleHeaderMenuClick = (key: string) => {
    navigate(`/${key}`);
  };

  // 添加页面加载动画效果
  useEffect(() => {
    const content = document.querySelector(".enhanced-content");
    if (content) {
      content.classList.add("animate-fade-in-up");
    }
  }, [location.pathname]);

  return (
    <Layout className="enhanced-layout" style={{ minHeight: "100vh" }}>
      {/* 增强的侧边栏 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="enhanced-sidebar"
        style={{
          overflow: "auto",
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
        }}
      >
        {/* 增强的Logo区域 */}
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: collapsed ? 16 : 20,
            fontWeight: "bold",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
          }}
          className="hover-lift"
        >
          <span className="gradient-text">{collapsed ? "M" : "Monitor"}</span>
        </div>

        {/* 增强的导航菜单 */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={["/errors"]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{
            borderRight: 0,
            background: "transparent",
            padding: "8px 0",
          }}
        />
      </Sider>

      {/* 增强的主内容区域 */}
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          minHeight: "100vh",
        }}
      >
        {/* 增强的响应式顶部导航栏 */}
        <div className="enhanced-header">
          <ResponsiveHeader
            collapsed={collapsed}
            onCollapse={setCollapsed}
            onMenuClick={handleHeaderMenuClick}
            title="监控管理系统"
            showSearch={true}
            showNotifications={true}
            showUserMenu={true}
            showThemeToggle={true}
            showFullscreen={true}
          />
        </div>

        {/* 增强的内容区域 */}
        <Content
          className="enhanced-content"
          style={{
            margin: "24px",
            padding: "32px",
            minHeight: "calc(100vh - 112px)",
            background: "white",
            position: "relative",
          }}
        >
          <div className="animate-fade-in-up">{children}</div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
