import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Upload,
  message,
  Select,
  Table,
  Space,
  Modal,
  Typography,
  Divider,
  Alert,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  UploadOutlined,
  LinkOutlined,
  EyeOutlined,
  DeleteOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useSourceCodeSourcemap } from "../../hooks/useSourceCodeSourcemap";
import type {
  SourceCodeSourcemapAssociation,
  UploadSourceCodeAndSourcemapResponse,
} from "../../types/sourceCodeSourcemapIntegration";
import { apiClient } from "../../services/api";

interface ProjectConfig {
  id: string;
  name: string;
  projectId: string;
}

const { Title, Text } = Typography;
const { Option } = Select;

interface Project {
  id: string;
  name: string;
}

const SourceCodeSourcemapIntegration: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [sourceCodeFile, setSourceCodeFile] = useState<File | null>(null);
  const [sourcemapFile, setSourcemapFile] = useState<File | null>(null);
  const [version, setVersion] = useState<string>(""); // 版本号状态
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

  // 使用自定义hooks替代useRequest
  const {
    projects,
    associations,
    loading: projectsLoading,
    associationsLoading,
    error,
    loadProjects,
    loadAssociations,
    uploadFiles,
    setActive,
    removeAssociation,
    clearErrorMessage,
  } = useSourceCodeSourcemap();

  // 加载项目列表
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // 项目选择变化
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].projectId);
    }
  }, [projects, selectedProject]);

  // 项目选择变化时加载关联信息
  useEffect(() => {
    if (selectedProject) {
      loadAssociations(selectedProject);
    }
  }, [selectedProject, loadAssociations]);

  // 错误处理
  useEffect(() => {
    if (error) {
      message.error(error);
      clearErrorMessage();
    }
  }, [error, clearErrorMessage]);

  // 处理源代码文件选择
  const handleSourceCodeChange = (info: any) => {
    const file = info.file;
    if (file) {
      if (file.type === "application/zip" || file.name?.endsWith(".zip")) {
        setSourceCodeFile(file);
      } else {
        message.error("请选择ZIP格式的源代码压缩包");
      }
    }
  };

  // 处理sourcemap文件选择
  const handleSourcemapChange = (info: any) => {
    const file = info.file;
    if (file) {
      if (file.type === "application/zip" || file.name?.endsWith(".zip")) {
        setSourcemapFile(file);
      } else {
        message.error("请选择ZIP格式的sourcemap压缩包");
      }
    }
  };

  // 上传源代码和sourcemap
  const handleUpload = async () => {
    if (!selectedProject) {
      message.error("请先选择项目");
      return;
    }
    if (!sourceCodeFile) {
      message.error("请选择源代码压缩包");
      return;
    }
    if (!sourcemapFile) {
      message.error("请选择sourcemap压缩包");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("projectId", selectedProject);
      formData.append("version", version); // 使用用户输入的版本号
      formData.append("sourceCodeArchive", sourceCodeFile);
      formData.append("sourcemapArchive", sourcemapFile);
      formData.append("setAsActive", "true");

      const success = await uploadFiles(formData);

      if (success) {
        message.success("上传成功，3秒后自动跳转到源代码管理页面");
        setIsUploadModalVisible(false);
        setSourceCodeFile(null);
        setSourcemapFile(null);

        // 重新加载关联信息
        await loadAssociations(selectedProject);

        // 延迟3秒后跳转
        setTimeout(() => {
          navigate("/source-code", {
            state: {
              projectId: selectedProject,
              version: version,
              highlightVersion: version,
            },
          });
        }, 3000);
      } else {
        message.error("上传失败");
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "上传失败");
    }
  };

  // 设置活跃关联
  const handleSetActive = async (associationId: string) => {
    if (!selectedProject) return;

    try {
      const success = await setActive(selectedProject, associationId);
      if (success) {
        message.success("设置成功");
      } else {
        message.error("设置失败");
      }
    } catch (error) {
      console.error("设置活跃关联失败:", error);
      message.error("设置失败");
    }
  };

  // 删除关联
  const handleDelete = async (associationId: string) => {
    if (!selectedProject) return;

    Modal.confirm({
      title: "确认删除",
      content: "确定要删除这个关联吗？此操作不可恢复。",
      okText: "确认",
      cancelText: "取消",
      onOk: async () => {
        try {
          const success = await removeAssociation(
            selectedProject,
            associationId
          );
          if (success) {
            message.success("删除成功");
          } else {
            message.error("删除失败");
          }
        } catch (error) {
          console.error("删除关联失败:", error);
          message.error("删除失败");
        }
      },
    });
  };

  const columns = [
    {
      title: "源代码版本",
      dataIndex: "sourceCodeVersion",
      key: "sourceCodeVersion",
    },
    {
      title: "Sourcemap版本",
      dataIndex: "sourceCodeVersion",
      key: "sourceCodeVersion",
    },
    {
      title: "状态",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <span style={{ color: isActive ? "#52c41a" : "#999" }}>
          {isActive ? "活跃" : "非活跃"}
        </span>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      render: (record: SourceCodeSourcemapAssociation) => (
        <Space size="middle">
          {!record.isActive && (
            <Button
              type="link"
              icon={<SettingOutlined />}
              onClick={() => handleSetActive(record.id)}
            >
              设为活跃
            </Button>
          )}
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={2}>源代码与Sourcemap集成管理</Title>

        <Alert
          message="功能说明"
          description="上传源代码和sourcemap压缩包，建立版本关联关系，用于错误定位和AI诊断"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* 项目选择 */}
          <div>
            <Text strong>选择项目：</Text>
            <Select
              value={selectedProject}
              onChange={setSelectedProject}
              placeholder="请选择项目"
              style={{ width: 300, marginLeft: 8 }}
              loading={projectsLoading}
              allowClear
            >
              {Array.isArray(projects) &&
                projects.map((project: any) => (
                  <Option key={project.id} value={project.projectId}>
                    {project.name}
                  </Option>
                ))}
            </Select>
          </div>

          {/* 上传区域 */}
          {selectedProject && (
            <Card title="上传源代码和Sourcemap" size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => setIsUploadModalVisible(true)}
                >
                  上传压缩包
                </Button>

                <Text type="secondary">
                  支持同时上传源代码和sourcemap的ZIP压缩包，系统会自动建立版本关联
                </Text>
              </Space>
            </Card>
          )}

          {/* 关联列表 */}
          {selectedProject && (
            <Card title="版本关联列表" size="small">
              <Table
                columns={columns}
                dataSource={associations}
                rowKey="id"
                loading={associationsLoading}
                pagination={false}
                locale={{ emptyText: "暂无关联信息" }}
              />
            </Card>
          )}
        </Space>
      </Card>

      {/* 上传模态框 */}
      <Modal
        title="上传源代码和Sourcemap压缩包"
        open={isUploadModalVisible}
        onCancel={() => {
          setIsUploadModalVisible(false);
          setSourceCodeFile(null);
          setSourcemapFile(null);
          setVersion("");
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsUploadModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="upload"
            type="primary"
            onClick={handleUpload}
            disabled={!sourceCodeFile || !sourcemapFile || !version}
          >
            开始上传
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text strong>版本号：</Text>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="请输入版本号（如：1.0.0）"
              style={{
                padding: "8px",
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                width: "100%",
                marginTop: "4px",
              }}
            />
          </div>

          <div>
            <Text strong>源代码压缩包：</Text>
            <Upload
              beforeUpload={() => false}
              onChange={handleSourceCodeChange}
              showUploadList={false}
              accept=".zip"
            >
              <Button icon={<UploadOutlined />}>
                {sourceCodeFile ? sourceCodeFile.name : "选择源代码ZIP文件"}
              </Button>
            </Upload>
          </div>

          <div>
            <Text strong>Sourcemap压缩包：</Text>
            <Upload
              beforeUpload={() => false}
              onChange={handleSourcemapChange}
              showUploadList={false}
              accept=".zip"
            >
              <Button icon={<UploadOutlined />}>
                {sourcemapFile ? sourcemapFile.name : "选择Sourcemap ZIP文件"}
              </Button>
            </Upload>
          </div>

          <Alert
            message="上传要求"
            description="请确保源代码和sourcemap压缩包来自同一构建版本，且包含完整的文件结构"
            type="warning"
            showIcon
          />
        </Space>
      </Modal>
    </div>
  );
};

export default SourceCodeSourcemapIntegration;
