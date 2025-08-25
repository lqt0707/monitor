/**
 * 权限管理页面
 * 提供角色和权限的配置功能
 */

import React, { useState, useEffect } from "react";
import {
  Card,
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
  Row,
  Col,
  Checkbox,
  Divider,
  Typography,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  UserOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../../utils/permissions";
import usePermission from "../../hooks/usePermission";

const { Option } = Select;
const { Title, Text } = Typography;
const CheckboxGroup = Checkbox.Group;

/**
 * 角色接口
 */
interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

/**
 * 角色表单数据接口
 */
interface RoleFormData {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
}

/**
 * 权限分组
 */
const PERMISSION_GROUPS = {
  user: {
    label: "用户管理",
    permissions: [
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
    ],
  },
  project: {
    label: "项目管理",
    permissions: [
      PERMISSIONS.PROJECT_VIEW,
      PERMISSIONS.PROJECT_CREATE,
      PERMISSIONS.PROJECT_UPDATE,
      PERMISSIONS.PROJECT_DELETE,
    ],
  },
  error: {
    label: "错误监控",
    permissions: [PERMISSIONS.ERROR_VIEW, PERMISSIONS.ERROR_DELETE],
  },
  system: {
    label: "系统设置",
    permissions: [PERMISSIONS.SYSTEM_CONFIG, PERMISSIONS.SYSTEM_LOGS],
  },
};

/**
 * 权限标签映射
 */
const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.USER_VIEW]: "查看用户",
  [PERMISSIONS.USER_CREATE]: "创建用户",
  [PERMISSIONS.USER_UPDATE]: "更新用户",
  [PERMISSIONS.USER_DELETE]: "删除用户",
  [PERMISSIONS.PROJECT_VIEW]: "查看项目",
  [PERMISSIONS.PROJECT_CREATE]: "创建项目",
  [PERMISSIONS.PROJECT_UPDATE]: "更新项目",
  [PERMISSIONS.PROJECT_DELETE]: "删除项目",
  [PERMISSIONS.ERROR_VIEW]: "查看错误",
  [PERMISSIONS.ERROR_DELETE]: "删除错误",
  [PERMISSIONS.SYSTEM_CONFIG]: "系统配置",
  [PERMISSIONS.SYSTEM_LOGS]: "系统日志",
};

/**
 * 权限管理页面组件
 * @returns JSX.Element
 */
const PermissionManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const { hasPermission, isAdmin } = usePermission();

  // 模拟角色数据
  const mockRoles: Role[] = [
    {
      id: "1",
      name: "admin",
      displayName: "管理员",
      description: "系统管理员，拥有所有权限",
      permissions: [...ROLE_PERMISSIONS.admin],
      userCount: 1,
      createdAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "user",
      displayName: "普通用户",
      description: "普通用户，只能查看和管理自己的项目",
      permissions: [...ROLE_PERMISSIONS.user],
      userCount: 2,
      createdAt: "2024-01-02T00:00:00Z",
    },
  ];

  /**
   * 加载角色列表
   */
  const loadRoles = async () => {
    try {
      // 模拟API调用
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setRoles(mockRoles);
    } catch (error) {
      message.error("加载角色列表失败");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 组件挂载时加载数据
   */
  useEffect(() => {
    if (hasPermission(PERMISSIONS.SYSTEM_CONFIG)) {
      loadRoles();
    }
  }, []);

  /**
   * 打开创建角色模态框
   */
  const handleCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  /**
   * 打开编辑角色模态框
   * @param role 角色信息
   */
  const handleEdit = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      permissions: role.permissions,
    });
    setModalVisible(true);
  };

  /**
   * 删除角色
   * @param roleId 角色ID
   */
  const handleDelete = async (roleId: string) => {
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      setRoles(roles.filter((role) => role.id !== roleId));
      message.success("角色删除成功");
    } catch (error) {
      message.error("删除角色失败");
    }
  };

  /**
   * 提交表单
   * @param values 表单数据
   */
  const handleSubmit = async (values: RoleFormData) => {
    try {
      setLoading(true);

      if (editingRole) {
        // 更新角色
        const updatedRole: Role = {
          ...editingRole,
          name: values.name,
          displayName: values.displayName,
          description: values.description,
          permissions: values.permissions,
        };
        setRoles(
          roles.map((role) => (role.id === editingRole.id ? updatedRole : role))
        );
        message.success("角色更新成功");
      } else {
        // 创建角色
        const newRole: Role = {
          id: Date.now().toString(),
          name: values.name,
          displayName: values.displayName,
          description: values.description,
          permissions: values.permissions,
          userCount: 0,
          createdAt: new Date().toISOString(),
        };
        setRoles([...roles, newRole]);
        message.success("角色创建成功");
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
  const columns: ColumnsType<Role> = [
    {
      title: "角色名称",
      dataIndex: "displayName",
      key: "displayName",
      render: (text: string, record: Role) => (
        <Space>
          <SafetyOutlined
            style={{ color: record.name === "admin" ? "#faad14" : "#1890ff" }}
          />
          <div>
            <div>{text}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.name}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "权限数量",
      dataIndex: "permissions",
      key: "permissions",
      render: (permissions: string[]) => (
        <Tag color="blue">{permissions.length} 个权限</Tag>
      ),
    },
    {
      title: "用户数量",
      dataIndex: "userCount",
      key: "userCount",
      render: (count: number) => (
        <Space>
          <UserOutlined />
          {count}
        </Space>
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
      render: (_, record: Role) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {record.name !== "admin" && record.name !== "user" && (
            <Popconfirm
              title="确定要删除这个角色吗？"
              description="删除后该角色的用户将失去相应权限"
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

  // 如果没有系统设置权限，显示无权限提示
  if (!hasPermission(PERMISSIONS.SYSTEM_CONFIG)) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <SettingOutlined
            style={{ fontSize: 64, color: "#ccc", marginBottom: 16 }}
          />
          <h3>无权限访问</h3>
          <p>您没有权限查看权限管理页面</p>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card
        title="权限管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建角色
          </Button>
        }
      >
        <Alert
          message="权限说明"
          description="通过角色管理用户权限，每个用户只能拥有一个角色。系统预设的管理员和普通用户角色不能删除。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={roles}
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

      {/* 角色表单模态框 */}
      <Modal
        title={editingRole ? "编辑角色" : "新建角色"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="角色标识"
                rules={[
                  { required: true, message: "请输入角色标识" },
                  {
                    pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                    message: "角色标识只能包含字母、数字和下划线，且以字母开头",
                  },
                ]}
              >
                <Input
                  placeholder="请输入角色标识"
                  disabled={
                    editingRole?.name === "admin" ||
                    editingRole?.name === "user"
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="displayName"
                label="角色名称"
                rules={[
                  { required: true, message: "请输入角色名称" },
                  { max: 50, message: "角色名称最多50个字符" },
                ]}
              >
                <Input placeholder="请输入角色名称" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="角色描述"
            rules={[
              { required: true, message: "请输入角色描述" },
              { max: 200, message: "角色描述最多200个字符" },
            ]}
          >
            <Input.TextArea placeholder="请输入角色描述" rows={3} />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="权限配置"
            rules={[{ required: true, message: "请选择至少一个权限" }]}
          >
            <div>
              {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                <div key={groupKey} style={{ marginBottom: 16 }}>
                  <Title level={5}>{group.label}</Title>
                  <CheckboxGroup
                    options={group.permissions.map((permission) => ({
                      label: PERMISSION_LABELS[permission],
                      value: permission,
                    }))}
                  />
                  <Divider />
                </div>
              ))}
            </div>
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
                {editingRole ? "更新" : "创建"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PermissionManagement;
