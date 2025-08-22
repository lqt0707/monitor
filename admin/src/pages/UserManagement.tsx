/**
 * 用户管理页面
 * 提供用户的增删改查功能
 */

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { usePermission } from "../hooks/usePermission";
import { PERMISSIONS } from "../utils/permissions";
import type { User } from "../types/monitor";

const { Option } = Select;

/**
 * 用户表单数据接口
 */
interface UserFormData {
  username: string;
  email: string;
  password?: string;
  role: "admin" | "user";
}

/**
 * 用户管理页面组件
 * @returns JSX.Element
 */
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const { hasPermission, isAdmin } = usePermission();

  // 模拟用户数据
  const mockUsers: User[] = [
    {
      id: "1",
      username: "admin",
      email: "admin@example.com",
      role: "admin",
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      username: "user1",
      email: "user1@example.com",
      role: "user",
      createdAt: "2024-01-02T00:00:00Z",
    },
    {
      id: "3",
      username: "user2",
      email: "user2@example.com",
      role: "user",
      createdAt: "2024-01-03T00:00:00Z",
    },
  ];

  /**
   * 加载用户列表
   */
  const loadUsers = async () => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUsers(mockUsers);
    } catch (error) {
      message.error("加载用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 组件挂载时加载数据
   */
  useEffect(() => {
    if (hasPermission(PERMISSIONS.USER_VIEW)) {
      loadUsers();
    }
  }, []);

  /**
   * 打开创建用户模态框
   */
  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  /**
   * 打开编辑用户模态框
   * @param user 用户信息
   */
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
    });
    setModalVisible(true);
  };

  /**
   * 删除用户
   * @param userId 用户ID
   */
  const handleDelete = async (userId: string) => {
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUsers(users.filter((user) => user.id !== userId));
      message.success("用户删除成功");
    } catch (error) {
      message.error("删除用户失败");
    }
  };

  /**
   * 提交表单
   * @param values 表单数据
   */
  const handleSubmit = async (values: UserFormData) => {
    try {
      setLoading(true);

      if (editingUser) {
        // 更新用户
        const updatedUser: User = {
          ...editingUser,
          username: values.username,
          email: values.email,
          role: values.role,
        };
        setUsers(
          users.map((user) => (user.id === editingUser.id ? updatedUser : user))
        );
        message.success("用户更新成功");
      } else {
        // 创建用户
        const newUser: User = {
          id: Date.now().toString(),
          username: values.username,
          email: values.email,
          role: values.role,
          createdAt: new Date().toISOString(),
        };
        setUsers([...users, newUser]);
        message.success("用户创建成功");
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 表格列配置
   */
  const columns: ColumnsType<User> = [
    {
      title: "用户名",
      dataIndex: "username",
      key: "username",
      render: (text: string, record: User) => (
        <Space>
          {record.role === "admin" ? (
            <CrownOutlined style={{ color: "#faad14" }} />
          ) : (
            <UserOutlined />
          )}
          {text}
        </Space>
      ),
    },
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "admin" ? "red" : "blue"}>
          {role === "admin" ? "管理员" : "普通用户"}
        </Tag>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "操作",
      key: "actions",
      render: (_, record: User) => (
        <Space>
          {hasPermission(PERMISSIONS.USER_UPDATE) && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {hasPermission(PERMISSIONS.USER_DELETE) &&
            record.role !== "admin" && (
              <Popconfirm
                title="确定要删除这个用户吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            )}
        </Space>
      ),
    },
  ];

  // 统计数据
  const totalUsers = users.length;
  const adminUsers = users.filter((user) => user.role === "admin").length;
  const normalUsers = users.filter((user) => user.role === "user").length;

  // 如果没有查看权限，显示无权限提示
  if (!hasPermission(PERMISSIONS.USER_VIEW)) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <UserOutlined
            style={{ fontSize: 64, color: "#ccc", marginBottom: 16 }}
          />
          <h3>无权限访问</h3>
          <p>您没有权限查看用户管理页面</p>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总用户数"
              value={totalUsers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="管理员"
              value={adminUsers}
              prefix={<CrownOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="普通用户"
              value={normalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* 用户列表 */}
      <Card
        title="用户管理"
        extra={
          hasPermission(PERMISSIONS.USER_CREATE) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              新建用户
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 用户表单模态框 */}
      <Modal
        title={editingUser ? "编辑用户" : "新建用户"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: "请输入用户名" },
              { min: 3, message: "用户名至少3个字符" },
              { max: 20, message: "用户名最多20个字符" },
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱地址" },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: "请输入密码" },
                { min: 6, message: "密码至少6个字符" },
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: "请选择角色" }]}
          >
            <Select placeholder="请选择角色">
              <Option value="user">普通用户</Option>
              {isAdmin && <Option value="admin">管理员</Option>}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingUser ? "更新" : "创建"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
