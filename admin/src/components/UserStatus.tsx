/**
 * 用户状态显示组件
 * 显示当前登录用户信息和 token 状态
 */

import React, { useState, useEffect } from 'react';
import { Dropdown, Avatar, Badge, Space, Typography, Divider, Button, Modal } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAppDispatch } from '../hooks/redux';
import { usePermission } from '../hooks/usePermission';
import { logoutAsync } from '../store/slices/authSlice';
import { tokenRefreshManager } from '../utils/tokenRefresh';

const { Text } = Typography;

/**
 * 用户状态组件
 * @returns JSX.Element
 */
const UserStatus: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isAdmin } = usePermission();
  const [tokenMinutes, setTokenMinutes] = useState<number>(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  /**
   * 更新 token 剩余时间
   */
  const updateTokenTime = () => {
    if (isAuthenticated) {
      const minutes = tokenRefreshManager.getTokenRemainingMinutes();
      setTokenMinutes(minutes);
    }
  };

  /**
   * 定时更新 token 时间
   */
  useEffect(() => {
    updateTokenTime();
    
    const timer = setInterval(updateTokenTime, 60000); // 每分钟更新一次
    
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  /**
   * 处理退出登录
   */
  const handleLogout = async () => {
    try {
      await dispatch(logoutAsync()).unwrap();
      setShowLogoutModal(false);
    } catch (error) {
      console.error('退出登录失败:', error);
    }
  };

  /**
   * 获取 token 状态颜色
   */
  const getTokenStatusColor = (): string => {
    if (tokenMinutes > 30) return 'green';
    if (tokenMinutes > 10) return 'orange';
    return 'red';
  };

  /**
   * 获取 token 状态文本
   */
  const getTokenStatusText = (): string => {
    if (tokenMinutes > 60) {
      const hours = Math.floor(tokenMinutes / 60);
      const mins = tokenMinutes % 60;
      return `${hours}小时${mins}分钟`;
    }
    return `${tokenMinutes}分钟`;
  };

  /**
   * 下拉菜单项
   */
  const menuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div style={{ padding: '8px 0' }}>
          <Space direction="vertical" size={4}>
            <Text strong>{user?.username || '未知用户'}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {user?.email || '无邮箱'}
            </Text>
            <Space size={4}>
              <Badge
                color={isAdmin ? 'gold' : 'blue'}
                text={
                  <Text style={{ fontSize: '12px' }}>
                    {isAdmin ? '管理员' : '普通用户'}
                  </Text>
                }
              />
            </Space>
          </Space>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'token-status',
      label: (
        <Space>
          <ClockCircleOutlined style={{ color: getTokenStatusColor() }} />
          <Text style={{ fontSize: '12px' }}>
            Token 剩余: {getTokenStatusText()}
          </Text>
        </Space>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      label: (
        <Space>
          <SettingOutlined />
          <span>个人设置</span>
        </Space>
      ),
      onClick: () => {
        // TODO: 打开个人设置页面
        console.log('打开个人设置');
      },
    },
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          <span>退出登录</span>
        </Space>
      ),
      onClick: () => setShowLogoutModal(true),
    },
  ];

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottomRight"
        trigger={['click']}
        overlayStyle={{ minWidth: 200 }}
      >
        <Space style={{ cursor: 'pointer', padding: '0 16px' }}>
          <Badge
            dot
            color={getTokenStatusColor()}
            offset={[-2, 2]}
          >
            <Avatar
              size="small"
              icon={<UserOutlined />}
              style={{
                backgroundColor: isAdmin ? '#faad14' : '#1890ff',
              }}
            />
          </Badge>
          <Text style={{ color: '#fff' }}>
            {user.username}
          </Text>
        </Space>
      </Dropdown>

      {/* 退出登录确认弹窗 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            确认退出
          </Space>
        }
        open={showLogoutModal}
        onOk={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
        okText="确认退出"
        cancelText="取消"
      >
        <p>确定要退出登录吗？</p>
      </Modal>
    </>
  );
};

export default UserStatus;