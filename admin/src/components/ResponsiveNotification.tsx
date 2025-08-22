import React, { useState, useEffect } from "react";
import {
  notification,
  Badge,
  Dropdown,
  List,
  Button,
  Typography,
  Space,
  Avatar,
  Empty,
  Divider,
  Tag,
} from "antd";
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  SettingOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import "../styles/responsive-components.css";
import type { MenuProps } from "antd";

const { Text, Title } = Typography;

interface NotificationItem {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  avatar?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    type?: "primary" | "default" | "dashed" | "link" | "text";
  }>;
  category?: string;
  priority?: "low" | "medium" | "high";
}

interface ResponsiveNotificationProps {
  className?: string;
  style?: React.CSSProperties;
  maxCount?: number;
  showSettings?: boolean;
  onSettingsClick?: () => void;
  placement?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}

/**
 * 响应式通知组件
 * 提供统一的通知管理和展示功能
 * @param props - 组件属性
 * @returns 响应式通知组件
 */
const ResponsiveNotification: React.FC<ResponsiveNotificationProps> = ({
  className = "",
  style = {},
  maxCount = 50,
  showSettings = true,
  onSettingsClick,
  placement = "bottomRight",
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [visible, setVisible] = useState(false);

  /**
   * 获取通知图标
   * @param type - 通知类型
   */
  const getNotificationIcon = (type: NotificationItem["type"]) => {
    const iconMap = {
      info: <InfoCircleOutlined style={{ color: "#1890ff" }} />,
      success: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
      warning: <WarningOutlined style={{ color: "#faad14" }} />,
      error: <CloseCircleOutlined style={{ color: "#ff4d4f" }} />,
    };
    return iconMap[type];
  };

  /**
   * 获取优先级标签
   * @param priority - 优先级
   */
  const getPriorityTag = (priority?: NotificationItem["priority"]) => {
    if (!priority || priority === "low") return null;

    const tagProps = {
      medium: { color: "orange", text: "中" },
      high: { color: "red", text: "高" },
    }[priority];

    return <Tag color={tagProps.color}>{tagProps.text}</Tag>;
  };

  /**
   * 格式化时间
   * @param timestamp - 时间戳
   */
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return timestamp.toLocaleDateString();
  };

  /**
   * 标记通知为已读
   * @param id - 通知ID
   */
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  /**
   * 删除通知
   * @param id - 通知ID
   */
  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * 标记所有通知为已读
   */
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  /**
   * 清空所有通知
   */
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  /**
   * 添加通知
   * @param notificationData - 通知项
   */
  const addNotification = (
    notificationData: Omit<NotificationItem, "id" | "timestamp" | "read">
  ) => {
    const newNotification: NotificationItem = {
      ...notificationData,
      id: `notification_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxCount);
    });

    // 显示系统通知
    notification.open({
      message: notificationData.title,
      description: notificationData.message,
      icon: getNotificationIcon(notificationData.type),
      placement,
      duration: notificationData.type === "error" ? 0 : 4.5,
    });
  };

  /**
   * 获取未读通知数量
   */
  const unreadCount = notifications.filter((item) => !item.read).length;

  /**
   * 渲染通知列表
   */
  const renderNotificationList = () => {
    if (notifications.length === 0) {
      return (
        <div className="notification-empty-state">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无通知"
            style={{ margin: 0 }}
          />
        </div>
      );
    }

    return (
      <List
        size="small"
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            className={`notification-item ${!item.read ? "unread" : ""}`}
            actions={[
              !item.read && (
                <Button
                  key="read"
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => markAsRead(item.id)}
                  title="标记为已读"
                />
              ),
              <Button
                key="delete"
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => deleteNotification(item.id)}
                title="删除"
                danger
              />,
            ].filter(Boolean)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size="small"
                  icon={getNotificationIcon(item.type)}
                  src={item.avatar}
                />
              }
              title={
                <Space size="small">
                  <Text strong={!item.read} style={{ fontSize: "13px" }}>
                    {item.title}
                  </Text>
                  {getPriorityTag(item.priority)}
                  {item.category && <Tag color="blue">{item.category}</Tag>}
                </Space>
              }
              description={
                <div>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: "12px",
                      display: "block",
                      marginBottom: "4px",
                    }}
                  >
                    {item.message}
                  </Text>
                  <Text type="secondary" style={{ fontSize: "11px" }}>
                    {formatTime(item.timestamp)}
                  </Text>
                </div>
              }
            />

            {/* 自定义操作按钮 */}
            {item.actions && item.actions.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <Space size="small">
                  {item.actions.map((action, index) => (
                    <Button
                      key={index}
                      type={action.type || "text"}
                      size="small"
                      onClick={action.onClick}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Space>
              </div>
            )}
          </List.Item>
        )}
      />
    );
  };

  /**
   * 渲染头部操作
   */
  const renderHeader = () => (
    <div className="notification-panel-header">
      <Title level={5} style={{ margin: 0 }}>
        通知中心
        {unreadCount > 0 && (
          <Badge
            count={unreadCount}
            size="small"
            style={{ marginLeft: "8px" }}
          />
        )}
      </Title>

      <Space size="small">
        {unreadCount > 0 && (
          <Button
            type="text"
            size="small"
            icon={<CheckOutlined />}
            onClick={markAllAsRead}
            title="全部已读"
          >
            全部已读
          </Button>
        )}

        {notifications.length > 0 && (
          <Button
            type="text"
            size="small"
            icon={<ClearOutlined />}
            onClick={clearAllNotifications}
            title="清空通知"
          >
            清空
          </Button>
        )}

        {showSettings && (
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={onSettingsClick}
            title="通知设置"
          />
        )}
      </Space>
    </div>
  );

  /**
   * 渲染下拉菜单
   */
  const popupRender = () => (
    <div className="notification-dropdown-panel">
      {renderHeader()}

      <div className="notification-content-area">
        {renderNotificationList()}
      </div>

      {notifications.length > 0 && (
        <>
          <Divider style={{ margin: 0 }} />
          <div className="notification-footer">
            <Button type="link" size="small">
              查看全部通知
            </Button>
          </div>
        </>
      )}
    </div>
  );

  // 模拟接收通知数据
  useEffect(() => {
    // 这里可以连接WebSocket或轮询API获取通知
    const mockNotifications: NotificationItem[] = [
      {
        id: "1",
        type: "error",
        title: "系统错误",
        message: "用户登录模块出现异常，请及时处理",
        timestamp: new Date(Date.now() - 300000),
        read: false,
        category: "系统",
        priority: "high",
      },
      {
        id: "2",
        type: "warning",
        title: "性能警告",
        message: "API响应时间超过阈值",
        timestamp: new Date(Date.now() - 600000),
        read: false,
        category: "性能",
        priority: "medium",
      },
      {
        id: "3",
        type: "info",
        title: "系统更新",
        message: "系统将在今晚进行维护更新",
        timestamp: new Date(Date.now() - 3600000),
        read: true,
        category: "系统",
      },
    ];

    setNotifications(mockNotifications);
  }, []);

  return (
    <div className={className} style={style}>
      <Dropdown
        open={visible}
        onOpenChange={setVisible}
        popupRender={popupRender}
        trigger={["click"]}
        placement="bottomRight"
      >
        <Button
          type="text"
          className="notification-trigger-btn"
          icon={
            <Badge count={unreadCount} size="small" offset={[0, 0]}>
              <BellOutlined style={{ fontSize: "16px" }} />
            </Badge>
          }
        />
      </Dropdown>
    </div>
  );
};

/**
 * 通知管理器
 * 提供全局通知管理功能
 */
export class NotificationManager {
  private static instance: NotificationManager;
  private notificationComponent: React.RefObject<any> = React.createRef();

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * 显示信息通知
   */
  info(title: string, message: string, options?: any) {
    notification.info({
      message: title,
      description: message,
      placement: "bottomRight",
      ...options,
    });
  }

  /**
   * 显示成功通知
   */
  success(title: string, message: string, options?: any) {
    notification.success({
      message: title,
      description: message,
      placement: "bottomRight",
      ...options,
    });
  }

  /**
   * 显示警告通知
   */
  warning(title: string, message: string, options?: any) {
    notification.warning({
      message: title,
      description: message,
      placement: "bottomRight",
      ...options,
    });
  }

  /**
   * 显示错误通知
   */
  error(title: string, message: string, options?: any) {
    notification.error({
      message: title,
      description: message,
      placement: "bottomRight",
      duration: 0, // 错误通知不自动关闭
      ...options,
    });
  }

  /**
   * 关闭所有通知
   */
  destroy() {
    notification.destroy();
  }
}

// 导出全局通知管理器实例
export const notificationManager = NotificationManager.getInstance();

export default ResponsiveNotification;
