/**
 * 登录页面组件
 * 提供用户登录功能
 */

import React, { useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { loginAsync, clearError } from '../store/slices/authSlice';
import type { LoginForm as LoginFormType } from '../types/monitor';

const { Title, Text } = Typography;

/**
 * 登录页面组件
 * @returns JSX.Element
 */
const Login: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, isAuthenticated, error } = useAppSelector((state) => state.auth);

  /**
   * 如果已登录，重定向到仪表盘
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * 清除错误信息
   */
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  /**
   * 处理表单提交
   * @param values 表单值
   */
  const handleSubmit = async (values: LoginFormType) => {
    try {
      const result = await dispatch(loginAsync(values));
      if (loginAsync.fulfilled.match(result)) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  /**
   * 处理表单提交失败
   * @param errorInfo 错误信息
   */
  const handleSubmitFailed = (errorInfo: any) => {
    console.error('Form validation failed:', errorInfo);
    message.error('请检查输入信息');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
        }}
      >
        {/* 标题区域 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8, color: '#1890ff' }}>
            Monitor Admin
          </Title>
          <Text type="secondary">错误监控管理平台</Text>
        </div>

        {/* 登录表单 */}
        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          onFinishFailed={handleSubmitFailed}
          autoComplete="off"
          size="large"
        >
          {/* 用户名输入框 */}
          <Form.Item
            name="username"
            rules={[
              {
                required: true,
                message: '请输入用户名',
              },
              {
                min: 3,
                message: '用户名至少3个字符',
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              autoComplete="username"
            />
          </Form.Item>

          {/* 密码输入框 */}
          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: '请输入密码',
              },
              {
                min: 6,
                message: '密码至少6个字符',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>

          {/* 错误信息显示 */}
          {error && (
            <div
              style={{
                color: '#ff4d4f',
                marginBottom: 16,
                textAlign: 'center',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* 登录按钮 */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 44,
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </Form.Item>
        </Form>

        {/* 底部信息 */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            © 2024 Monitor Admin. All rights reserved.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;