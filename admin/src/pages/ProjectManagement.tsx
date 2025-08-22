/**
 * 项目管理页面组件
 * 管理监控项目的配置和设置
 */

import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Switch,
  Typography,
  Row,
  Col,
  Popconfirm,
  message,
  Tag,
  Spin,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../store/slices/projectSlice";
import type { ProjectConfig } from "../types/monitor";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 项目管理页面组件
 * @returns JSX.Element
 */
const ProjectManagement: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projects, loading, error } = useAppSelector(
    (state: any) => state.project
  );

  // 本地状态
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectConfig | null>(
    null
  );
  const [form] = Form.useForm();

  /**
   * 组件挂载时获取数据
   */
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  /**
   * 打开新建项目模态框
   */
  const handleCreate = () => {
    setEditingProject(null);
    form.resetFields();
    setModalVisible(true);
  };

  /**
   * 打开编辑项目模态框
   * @param project 项目配置
   */
  const handleEdit = (project: ProjectConfig) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      description: project.description,
      domain: project.domain,
      enableSourcemap: project.sourcemapConfig?.isEnabled || false,
      sourcemapUrl: (project.sourcemapConfig as any)?.url || "",
      enableEmail: (project as any).emailConfig?.enabled || false,
      emailRecipients:
        (project as any).emailConfig?.recipients?.join(", ") || "",
      emailThreshold: (project as any).emailConfig?.threshold || 10,
    });
    setModalVisible(true);
  };

  /**
   * 删除项目
   * @param id 项目ID
   */
  const handleDelete = async (id: number) => {
    try {
      await dispatch(deleteProject(id.toString())).unwrap();
      message.success("项目删除成功");
    } catch (error) {
      message.error("删除失败");
    }
  };

  /**
   * 提交表单
   * @param values 表单值
   */
  const handleSubmit = async (values: any) => {
    try {
      // 基础项目数据（不包含复杂的嵌套配置）
      const projectData = {
        name: values.name,
        description: values.description,
        domain: values.domain,
        isActive: true,
        alertThreshold: values.emailThreshold || 10,
        // 简化的sourcemap配置，只传递必要字段
        enableSourcemap: values.enableSourcemap || false,
        sourcemapUrl: values.sourcemapUrl || "",
        // 邮件配置
        enableEmail: values.enableEmail || false,
        emailRecipients: values.emailRecipients || "",
        emailThreshold: values.emailThreshold || 10,
      };

      if (editingProject) {
        await dispatch(
          updateProject({
            id: editingProject.id.toString(),
            project: projectData,
          })
        ).unwrap();
        message.success("项目更新成功");
      } else {
        await dispatch(createProject(projectData as any)).unwrap();
        message.success("项目创建成功");
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error(editingProject ? "更新失败" : "创建失败");
    }
  };

  /**
   * 复制项目密钥
   * @param apiKey API密钥
   */
  const handleCopyApiKey = (apiKey: string) => {
    navigator.clipboard
      .writeText(apiKey)
      .then(() => {
        message.success("API密钥已复制到剪贴板");
      })
      .catch(() => {
        message.error("复制失败");
      });
  };

  /**
   * 生成SDK集成代码
   * @param project 项目配置
   */
  const generateSDKCode = (project: ProjectConfig) => {
    return `// 项目配置信息
项目ID: ${project.id}
API密钥: ${(project as any).apiKey || "请联系管理员获取"}
服务端点: http://localhost:3001/api/errors

// 集成说明
1. 请根据您的技术栈选择合适的SDK
2. 使用上述配置信息初始化SDK
3. 配置错误监控和性能监控
4. 测试集成是否正常工作

// 更多集成文档请参考官方文档`;
  };

  // 表格列定义
  const columns: ColumnsType<ProjectConfig> = [
    {
      title: "项目名称",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 180 }}>
          {text || "暂无描述"}
        </Text>
      ),
    },
    {
      title: "域名",
      dataIndex: "domain",
      key: "domain",
      width: 150,
      render: (domain: string) => <Text code>{domain}</Text>,
    },
    {
      title: "API密钥",
      key: "apiKey",
      width: 200,
      render: (_, record: ProjectConfig) => (
        <Space>
          <Text code ellipsis style={{ maxWidth: 120 }}>
            {(record as any).apiKey?.substring(0, 8)}...
          </Text>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyApiKey((record as any).apiKey)}
          >
            复制
          </Button>
        </Space>
      ),
    },
    {
      title: "配置状态",
      key: "config",
      width: 150,
      render: (_, record: ProjectConfig) => (
        <Space direction="vertical" size="small">
          <Tag color={record.sourcemapConfig?.isEnabled ? "green" : "default"}>
            Sourcemap: {record.sourcemapConfig?.isEnabled ? "启用" : "禁用"}
          </Tag>
          <Tag
            color={(record as any).emailConfig?.enabled ? "green" : "default"}
          >
            邮件: {(record as any).emailConfig?.enabled ? "启用" : "禁用"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record: ProjectConfig) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => navigate(`/projects/${record.id}/config`)}
          >
            配置
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => {
              Modal.info({
                title: "SDK 集成代码",
                width: 600,
                content: (
                  <div>
                    <Paragraph>
                      将以下代码添加到您的项目中以开始错误监控：
                    </Paragraph>
                    <pre
                      style={{
                        background: "#f5f5f5",
                        padding: "12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        overflow: "auto",
                        maxHeight: "300px",
                      }}
                    >
                      {generateSDKCode(record)}
                    </pre>
                  </div>
                ),
              });
            }}
          >
            集成
          </Button>
          <Popconfirm
            title="确定要删除这个项目吗？"
            description="删除后将无法恢复，相关的错误日志也会被删除。"
            onConfirm={() => handleDelete(record.id as any)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>项目管理</Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建项目
          </Button>
        </Col>
      </Row>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{
            total: projects.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个项目`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 项目配置模态框 */}
      <Modal
        title={editingProject ? "编辑项目" : "新建项目"}
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
            name="name"
            label="项目名称"
            rules={[
              { required: true, message: "请输入项目名称" },
              { max: 50, message: "项目名称不能超过50个字符" },
            ]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="项目描述"
            rules={[{ max: 200, message: "描述不能超过200个字符" }]}
          >
            <TextArea placeholder="请输入项目描述（可选）" rows={3} />
          </Form.Item>

          <Form.Item
            name="domain"
            label="项目域名"
            rules={[
              { required: true, message: "请输入项目域名" },
              { pattern: /^[a-zA-Z0-9.-]+$/, message: "请输入有效的域名" },
            ]}
          >
            <Input placeholder="例如：example.com" />
          </Form.Item>

          <Card
            title="Sourcemap 配置"
            size="small"
            style={{ marginBottom: 16 }}
          >
            <Form.Item
              name="enableSourcemap"
              label="启用 Sourcemap"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="sourcemapUrl"
              label="Sourcemap URL"
              dependencies={["enableSourcemap"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (getFieldValue("enableSourcemap") && !value) {
                      return Promise.reject(
                        new Error("启用 Sourcemap 时必须提供 URL")
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input placeholder="https://example.com/sourcemaps/" />
            </Form.Item>
          </Card>

          <Card title="邮件通知配置" size="small" style={{ marginBottom: 16 }}>
            <Form.Item
              name="enableEmail"
              label="启用邮件通知"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="emailRecipients"
              label="收件人邮箱"
              dependencies={["enableEmail"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (getFieldValue("enableEmail") && !value) {
                      return Promise.reject(
                        new Error("启用邮件通知时必须提供收件人")
                      );
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input placeholder="多个邮箱用逗号分隔，例如：admin@example.com, dev@example.com" />
            </Form.Item>

            <Form.Item
              name="emailThreshold"
              label="通知阈值"
              dependencies={["enableEmail"]}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (getFieldValue("enableEmail") && (!value || value < 1)) {
                      return Promise.reject(new Error("通知阈值必须大于0"));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input
                type="number"
                placeholder="当错误数量达到此值时发送邮件通知"
                min={1}
              />
            </Form.Item>
          </Card>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingProject ? "更新" : "创建"}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectManagement;
