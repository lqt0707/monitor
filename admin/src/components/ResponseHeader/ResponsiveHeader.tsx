import React, { useState } from "react";
import {
  Layout,
  Button,
  Dropdown,
  Avatar,
  Badge,
  Space,
  Drawer,
  Menu,
  Typography,
  Switch,
  Divider,
  Tooltip,
} from "antd";
import {
  MenuOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  GlobalOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import "../../styles/responsive-components.css";
import ResponsiveNotification from "../ResponsiveNotification";
import ResponsiveSearch from "../ResponsiveSearch";
import type { MenuProps } from "antd";
import "./index.css";
import { logoutAsync } from "../../store/slices/authSlice";
import { useAppDispatch } from "../../hooks/redux";

const { Header } = Layout;
const { Text } = Typography;

interface ResponsiveHeaderProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  onMenuClick?: (key: string) => void;
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showUserMenu?: boolean;
  showThemeToggle?: boolean;
  showFullscreen?: boolean;
  className?: string;
}

/**
 * 响应式头部组件
 * 提供移动端友好的导航栏，包含菜单切换、通知、用户菜单等功能
 * @param props - 组件属性
 * @returns 响应式头部组件
 */
const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  collapsed,
  onCollapse,
  onMenuClick,
  title = "监控管理系统",
  showSearch = true,
  showNotifications = true,
  showUserMenu = true,
  showThemeToggle = true,
  showFullscreen = true,
  className = "",
}) => {
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(5);
  const dispatch = useAppDispatch();
  /**
   * 处理移动端菜单切换
   */
  const handleMobileMenuToggle = () => {
    setMobileMenuVisible(!mobileMenuVisible);
  };

  /**
   * 处理主题切换
   */
  const handleThemeToggle = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.setAttribute(
      "data-theme",
      checked ? "dark" : "light"
    );
  };

  /**
   * 处理全屏切换
   */
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  /**
   * 处理搜索
   */
  const handleSearch = () => {
    // 实现搜索功能
    console.log("搜索功能");
  };

  /**
   * 处理通知点击
   */
  const handleNotificationClick = () => {
    // 实现通知功能
    console.log("通知功能");
    setNotificationCount(0);
  };

  /**
   * 用户菜单项
   */
  const userMenuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "个人资料",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "账户设置",
    },
    {
      type: "divider",
    },
    {
      key: "help",
      icon: <QuestionCircleOutlined />,
      label: "帮助中心",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      danger: true,
    },
  ];

  /**
   * 处理用户菜单点击
   */
  const handleUserMenuClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") {
      // 实现退出登录逻辑
      console.log("退出登录");
    } else {
      onMenuClick?.(key);
    }
  };

  /**
   * 移动端菜单项
   */
  const mobileMenuItems: MenuProps["items"] = [
    {
      key: "dashboard",
      label: "仪表板",
    },
    {
      key: "monitoring",
      label: "错误监控",
    },
    {
      key: "projects",
      label: "项目管理",
    },
    {
      key: "statistics",
      label: "统计报表",
    },
    {
      key: "settings",
      label: "系统设置",
    },
  ];

  /**
   * 处理退出登录
   */
  const handleLogout = async () => {
    try {
      await dispatch(logoutAsync()).unwrap();
    } catch (error) {
      console.error("退出登录失败:", error);
    }
  };

  return (
    <>
      <Header className={`responsive-header modern-header ${className}`}>
        {/* 左侧区域 */}
        <div className="header-left">
          {/* 桌面端菜单切换按钮 */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => onCollapse(!collapsed)}
            className="menu-toggle-btn hide-mobile"
          />

          {/* 移动端菜单切换按钮 */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={handleMobileMenuToggle}
            className="show-mobile"
            style={{
              fontSize: "16px",
              width: 40,
              height: 40,
            }}
          />

          {/* 系统标题 */}
          <Text strong className="heading-responsive" style={{ margin: 0 }}>
            {title}
          </Text>
        </div>

        {/* 右侧区域 */}
        <div className="header-right">
          {/* 搜索框 */}
          {showSearch && (
            <ResponsiveSearch
              placeholder="搜索页面、功能、数据..."
              onSearch={(query, results) => {
                console.log("Search:", query, results);
              }}
              onResultClick={(result) => {
                console.log("Result clicked:", result);
              }}
            />
          )}

          {/* 全屏切换 */}
          {showFullscreen && (
            <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
              <Button
                type="text"
                icon={
                  isFullscreen ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )
                }
                onClick={handleFullscreenToggle}
                className="header-action-btn hide-mobile"
              />
            </Tooltip>
          )}

          {/* 主题切换 */}
          {showThemeToggle && (
            <Tooltip title={darkMode ? "切换到浅色模式" : "切换到深色模式"}>
              <Switch
                checked={darkMode}
                onChange={handleThemeToggle}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
                className="theme-switch hide-mobile"
              />
            </Tooltip>
          )}

          {/* 通知 */}
          {showNotifications && (
            <ResponsiveNotification
              showSettings={true}
              onSettingsClick={() => {
                console.log("Notification settings clicked");
              }}
            />
          )}

          {/* 用户菜单 */}
          {showUserMenu && (
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              arrow
            >
              <Button type="text" className="user-menu-btn">
                <Space>
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "#1890ff" }}
                  />
                  <Text className="hide-mobile">管理员</Text>
                </Space>
              </Button>
            </Dropdown>
          )}
        </div>
      </Header>

      {/* 移动端菜单抽屉 */}
      <Drawer
        title={title}
        placement="left"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        width={280}
        className="show-mobile"
        styles={{
          body: { padding: 0 },
        }}
      >
        <Menu
          mode="inline"
          items={mobileMenuItems}
          onClick={({ key }) => {
            onMenuClick?.(key);
            setMobileMenuVisible(false);
          }}
          style={{ border: "none" }}
        />

        <Divider />

        {/* 移动端设置区域 */}
        <div style={{ padding: "16px" }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            {showThemeToggle && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text>深色模式</Text>
                <Switch
                  checked={darkMode}
                  onChange={handleThemeToggle}
                  checkedChildren={<MoonOutlined />}
                  unCheckedChildren={<SunOutlined />}
                />
              </div>
            )}

            <Button
              type="text"
              icon={<GlobalOutlined />}
              style={{ justifyContent: "flex-start", padding: "8px 0" }}
            >
              语言设置
            </Button>

            <Button
              type="text"
              icon={<QuestionCircleOutlined />}
              style={{ justifyContent: "flex-start", padding: "8px 0" }}
            >
              帮助中心
            </Button>

            <Button
              type="text"
              icon={<LogoutOutlined />}
              danger
              style={{ justifyContent: "flex-start", padding: "8px 0" }}
              onClick={() => handleLogout()}
            >
              退出登录
            </Button>
          </Space>
        </div>
      </Drawer>
    </>
  );
};

export default ResponsiveHeader;
