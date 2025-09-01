import React, { useState, useEffect } from "react";
import {
  Card,
  Tree,
  Select,
  Button,
  Space,
  Spin,
  Empty,
  message,
  Typography,
  Upload,
  Divider,
  Tabs,
  Modal,
  Tooltip,
  Tag,
} from "antd";
import {
  FolderOutlined,
  FileOutlined,
  UploadOutlined,
  ReloadOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import type { DirectoryTreeProps } from "antd/es/tree/DirectoryTree";
import type { UploadProps, RcFile } from "antd/es/upload";
import SourceCodeViewer from "../../components/SourceCodeViewer";
import {
  fetchSourceCodeVersions,
  fetchSourceCodeFiles,
  uploadSourceCodeArchive,
  setActiveSourceCodeVersion,
  deleteSourceCodeVersion,
  fetchSourceCodeContent,
} from "../../services/errorSourceCode";
import { apiClient } from "../../services";
import "./SourceCodeManager.css";
import { useInitialLoad } from "../../hooks/useInitialLoad";

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { DirectoryTree } = Tree;

// 文件树节点类型
interface FileNode {
  key: string;
  title: string;
  isLeaf: boolean;
  children?: FileNode[];
  path?: string;
  type?: string;
}

// 版本信息类型
interface VersionInfo {
  id: string;
  projectId: string;
  version: string;
  uploadedAt: string;
  fileCount: number;
  isActive: boolean;
  hasSourcemap?: boolean;
  sourcemapVersion?: string;
  sourcemapAssociatedAt?: string;
}

const SourceCodeManager: React.FC = () => {
  // 项目选择状态
  const [projectId, setProjectId] = useState<string>("");
  const [projectList, setProjectList] = useState<
    { id: string; name: string }[]
  >([]);

  // 版本管理状态
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string>("");
  const [versionLoading, setVersionLoading] = useState(false);

  // 文件树状态
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 文件内容状态
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [fileLanguage, setFileLanguage] = useState<string>("javascript");

  // 上传状态
  const [uploadLoading, setUploadLoading] = useState(false);

  // 删除确认状态
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<string>("");
  const loadProjects = async () => {
    try {
      const projects = await apiClient.projects.getList();
      setProjectList(
        projects.map((project) => ({
          id: project.projectId,
          name: project.name,
        }))
      );

      // 如果有项目，默认选择第一个
      if (projects.length > 0) {
        const firstProject = projects[0];
        setProjectId(firstProject.projectId);
        loadVersions(firstProject.projectId);
      }
    } catch (error) {
      console.error("加载项目列表失败:", error);
      message.error("加载项目列表失败");
    }
  };

  useInitialLoad(loadProjects);

  // 加载版本列表
  const loadVersions = async (pid: string) => {
    if (!pid) return;

    try {
      setVersionLoading(true);
      const response = await fetchSourceCodeVersions(pid);
      if (response.success) {
        // 处理字段映射：API返回createdAt，前端使用uploadedAt
        const versionsWithMappedFields = response.data.map((version: any) => ({
          ...version,
          uploadedAt: version.createdAt || version.uploadedAt
        }));
        setVersions(versionsWithMappedFields || []);

        // 如果有活跃版本，自动选择
        const activeVersion = versionsWithMappedFields.find((v: VersionInfo) => v.isActive);
        if (activeVersion) {
          setSelectedVersion(activeVersion.version);
          loadFileTree(pid, activeVersion.version);
        } else if (versionsWithMappedFields.length > 0) {
          setSelectedVersion(versionsWithMappedFields[0].version);
          loadFileTree(pid, versionsWithMappedFields[0].version);
        }
      } else {
        message.error(response.message || "加载版本列表失败");
      }
    } catch (error) {
      console.error("加载版本列表失败:", error);
      message.error("加载版本列表失败");
    } finally {
      setVersionLoading(false);
    }
  };

  // 加载文件树
  const loadFileTree = async (pid: string, version: string) => {
    if (!pid || !version) return;

    try {
      setTreeLoading(true);
      const response = await fetchSourceCodeFiles(pid, version);
      console.log("API响应:", response);

      if (response.success) {
        console.log("原始文件数据:", response.data);

        // 构建文件树结构
        const tree = buildFileTree(response.data || []);
        console.log("构建的文件树:", tree);

        setTreeData(tree);

        // 默认展开第一级
        if (tree.length > 0) {
          setExpandedKeys([tree[0].key]);
        }
      } else {
        message.error(response.message || "加载文件列表失败");
      }
    } catch (error) {
      console.error("加载文件列表失败:", error);
      message.error("加载文件列表失败");
    } finally {
      setTreeLoading(false);
    }
  };

  // 构建文件树结构
  const buildFileTree = (
    files: { filePath: string; fileType: string }[]
  ): FileNode[] => {
    const pathMap = new Map<string, FileNode>();

    // 按路径排序，确保父目录先创建
    files.sort((a, b) => a.filePath.localeCompare(b.filePath));

    // 首先创建所有节点
    files.forEach((file) => {
      const fullPath = file.filePath;
      const pathParts = fullPath.split("/");

      // 为每一级路径创建节点
      for (let i = 0; i < pathParts.length; i++) {
        const currentPath = pathParts.slice(0, i + 1).join("/");
        const isLastPart = i === pathParts.length - 1;
        const part = pathParts[i];

        if (!pathMap.has(currentPath)) {
          const node: FileNode = {
            key: currentPath,
            title: part,
            isLeaf: isLastPart,
            path: currentPath,
            type: isLastPart ? "file" : "directory",
            children: isLastPart ? undefined : [],
          };
          pathMap.set(currentPath, node);
        }
      }
    });

    // 构建父子关系
    const allNodes = Array.from(pathMap.values());
    const rootNodes: FileNode[] = [];

    // 按路径长度排序，确保父节点先处理
    allNodes.sort(
      (a, b) => a.path!.split("/").length - b.path!.split("/").length
    );

    allNodes.forEach((node) => {
      const pathParts = node.path!.split("/");
      if (pathParts.length === 1) {
        // 根节点
        rootNodes.push(node);
      } else {
        // 子节点，找到父节点并添加
        const parentPath = pathParts.slice(0, -1).join("/");
        const parentNode = pathMap.get(parentPath);
        if (
          parentNode &&
          parentNode.children &&
          !parentNode.children.find((child) => child.key === node.key)
        ) {
          parentNode.children.push(node);
        }
      }
    });

    // 对每个节点的子节点进行排序（目录在前，文件在后，同类型按名称排序）
    const sortChildren = (nodes: FileNode[]) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          node.children.sort((a, b) => {
            // 目录优先
            if (a.type === "directory" && b.type === "file") return -1;
            if (a.type === "file" && b.type === "directory") return 1;
            // 同类型按名称排序
            return a.title.localeCompare(b.title);
          });
          sortChildren(node.children);
        }
      });
    };

    sortChildren(rootNodes);
    console.log("最终文件树结构:", rootNodes);
    return rootNodes;
  };

  // 加载文件内容
  const loadFileContent = async (filePath: string) => {
    if (!projectId || !selectedVersion || !filePath) return;

    try {
      setFileContentLoading(true);
      const response = await fetchSourceCodeContent(
        projectId,
        selectedVersion,
        filePath
      );
      if (response.success) {
        setFileContent(response.data.content || "// 文件内容为空");

        // 根据文件扩展名设置语言
        const extension = filePath.split(".").pop()?.toLowerCase() || "";
        switch (extension) {
          case "js":
            setFileLanguage("javascript");
            break;
          case "ts":
            setFileLanguage("typescript");
            break;
          case "jsx":
            setFileLanguage("jsx");
            break;
          case "tsx":
            setFileLanguage("tsx");
            break;
          case "css":
            setFileLanguage("css");
            break;
          case "scss":
            setFileLanguage("scss");
            break;
          case "html":
            setFileLanguage("html");
            break;
          case "json":
            setFileLanguage("json");
            break;
          default:
            setFileLanguage("javascript");
        }
      } else {
        message.error(response.message || "加载文件内容失败");
      }
    } catch (error) {
      console.error("加载文件内容失败:", error);
      message.error("加载文件内容失败");
    } finally {
      setFileContentLoading(false);
    }
  };

  // 处理项目变更
  const handleProjectChange = (value: string) => {
    setProjectId(value);
    setSelectedVersion("");
    setVersions([]);
    setTreeData([]);
    setSelectedFile(null);
    setFileContent("");
    loadVersions(value);
  };

  // 处理版本变更
  const handleVersionChange = (value: string) => {
    setSelectedVersion(value);
    setTreeData([]);
    setSelectedFile(null);
    setFileContent("");
    loadFileTree(projectId, value);
  };

  // 处理文件选择
  const handleFileSelect: DirectoryTreeProps["onSelect"] = (
    selectedKeys,
    info
  ) => {
    const node = info.node as unknown as FileNode;
    if (node.isLeaf) {
      setSelectedFile(node.path || null);
      loadFileContent(node.path || "");
    }
  };

  // 高亮错误文件或版本（从路由状态获取）
  useEffect(() => {
    const location = window.location;
    if (location.pathname === "/source-code") {
      const state = (location as any).state;
      if (state?.highlightFile) {
        // 延迟执行，确保文件树已加载
        setTimeout(() => {
          highlightErrorFile(state.highlightFile);
        }, 500);
      } else if (state?.highlightVersion) {
        // 高亮显示指定版本
        const targetVersion = state.highlightVersion;
        const versionExists = versions.some((v: VersionInfo) => v.version === targetVersion);
        
        if (versionExists) {
          setSelectedVersion(targetVersion);
          loadFileTree(projectId, targetVersion);
          message.success(`已切换到版本 ${targetVersion}`);
        } else {
          message.warning(`版本 ${targetVersion} 不存在`);
        }
      }
    }
  }, [treeData, versions, projectId]);

  // 高亮错误文件
  const highlightErrorFile = (errorFilePath: string) => {
    if (!errorFilePath || treeData.length === 0) return;

    // 展开到错误文件路径
    const pathParts = errorFilePath.split("/");
    const expandKeys: string[] = [];

    for (let i = 1; i < pathParts.length; i++) {
      expandKeys.push(pathParts.slice(0, i).join("/"));
    }

    setExpandedKeys(expandKeys);
    // 文件树选中逻辑已通过其他方式处理

    // 滚动到错误文件
    setTimeout(() => {
      const errorFileElement = document.querySelector(
        `[data-key="${errorFilePath}"]`
      );
      if (errorFileElement) {
        errorFileElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };

  // 处理文件树展开/收起
  const handleExpand: DirectoryTreeProps["onExpand"] = (expandedKeys) => {
    setExpandedKeys(expandedKeys as string[]);
  };

  // 处理上传前检查
  const beforeUpload = (file: RcFile) => {
    const isZip =
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed" ||
      file.name.endsWith(".zip");

    if (!isZip) {
      message.error("只能上传ZIP格式的源代码压缩包!");
      return Upload.LIST_IGNORE;
    }

    if (!projectId) {
      message.error("请先选择项目!");
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  // 处理上传
  const handleUpload: UploadProps["customRequest"] = async (options) => {
    if (!options.file || !projectId) return;

    try {
      setUploadLoading(true);

      const formData = new FormData();
      formData.append("file", options.file as Blob);
      formData.append("projectId", projectId);

      const response = await uploadSourceCodeArchive(formData);

      if (response.success) {
        message.success("源代码上传成功!");
        // 重新加载版本列表
        loadVersions(projectId);
      } else {
        message.error(response.message || "上传失败");
      }
    } catch (error) {
      console.error("上传源代码失败:", error);
      message.error("上传源代码失败");
    } finally {
      setUploadLoading(false);
    }
  };

  // 设置活跃版本
  const handleSetActiveVersion = async (versionId: string) => {
    if (!projectId || !versionId) return;

    try {
      const response = await setActiveSourceCodeVersion(projectId, versionId);
      if (response.success) {
        message.success("已设置为活跃版本");
        // 更新版本列表
        loadVersions(projectId);
      } else {
        message.error(response.message || "设置活跃版本失败");
      }
    } catch (error) {
      console.error("设置活跃版本失败:", error);
      message.error("设置活跃版本失败");
    }
  };

  // 删除版本
  const handleDeleteVersion = async () => {
    if (!projectId || !versionToDelete) {
      setDeleteModalVisible(false);
      return;
    }

    try {
      const response = await deleteSourceCodeVersion(
        projectId,
        versionToDelete
      );
      if (response.success) {
        message.success("版本已删除");
        // 更新版本列表
        loadVersions(projectId);
        // 如果删除的是当前选中的版本，清空选择
        if (versionToDelete === selectedVersion) {
          setSelectedVersion("");
          setTreeData([]);
          setSelectedFile(null);
          setFileContent("");
        }
      } else {
        message.error(response.message || "删除版本失败");
      }
    } catch (error) {
      console.error("删除版本失败:", error);
      message.error("删除版本失败");
    } finally {
      setDeleteModalVisible(false);
      setVersionToDelete("");
    }
  };

  // 确认删除版本
  const confirmDeleteVersion = (version: string) => {
    setVersionToDelete(version);
    setDeleteModalVisible(true);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="source-code-manager">
      <Card className="source-code-header-card">
        <Title level={4}>源代码管理</Title>
        <div className="source-code-header-actions">
          <Space size="middle" align="center">
            <div>
              <Text strong>项目：</Text>
              <Select
                placeholder="选择项目"
                style={{ width: 200 }}
                value={projectId || undefined}
                onChange={handleProjectChange}
                options={projectList.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
              />
            </div>

            <div>
              <Text strong>版本：</Text>
              <Select
                placeholder="选择版本"
                style={{ width: 200 }}
                value={selectedVersion || undefined}
                onChange={handleVersionChange}
                loading={versionLoading}
                disabled={!projectId || versionLoading}
                options={versions.map((v) => ({
                  value: v.version,
                  label: `${v.version}${v.isActive ? " (活跃)" : ""}`,
                }))}
              />
            </div>

            <Upload
              beforeUpload={beforeUpload}
              customRequest={handleUpload}
              showUploadList={false}
              disabled={!projectId || uploadLoading}
            >
              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={uploadLoading}
                disabled={!projectId}
              >
                上传源代码
              </Button>
            </Upload>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadVersions(projectId)}
              disabled={!projectId}
            >
              刷新
            </Button>
          </Space>
        </div>
      </Card>

      <div className="source-code-content">
        <Tabs defaultActiveKey="files" className="source-code-tabs">
          <TabPane tab="文件浏览" key="files">
            <div className="source-code-explorer">
              <Card className="file-tree-card" title="文件结构">
                {treeLoading ? (
                  <div className="tree-loading">
                    <Spin tip="加载文件列表..." />
                  </div>
                ) : treeData.length > 0 ? (
                  <DirectoryTree
                    showIcon
                    defaultExpandAll={false}
                    expandedKeys={expandedKeys}
                    onExpand={handleExpand}
                    onSelect={handleFileSelect}
                    treeData={treeData as unknown as DataNode[]}
                    icon={({ isLeaf }) =>
                      isLeaf ? <FileOutlined /> : <FolderOutlined />
                    }
                  />
                ) : (
                  <Empty
                    description={
                      !projectId
                        ? "请选择项目"
                        : !selectedVersion
                        ? "请选择版本"
                        : "没有文件"
                    }
                  />
                )}
              </Card>

              <div className="file-content-container">
                {selectedFile ? (
                  <SourceCodeViewer
                    code={fileContent}
                    language={fileLanguage}
                    fileName={selectedFile}
                    loading={fileContentLoading}
                    showLineNumbers={true}
                    darkMode={true}
                  />
                ) : (
                  <Card className="empty-file-card">
                    <Empty description="请选择文件查看内容" />
                  </Card>
                )}
              </div>
            </div>
          </TabPane>

          <TabPane tab="版本管理" key="versions">
            <Card className="versions-card">
              {versionLoading ? (
                <div className="versions-loading">
                  <Spin tip="加载版本列表..." />
                </div>
              ) : versions.length > 0 ? (
                <div className="versions-list">
                  {versions.map((version) => (
                    <Card
                      key={version.id}
                      className={`version-item ${
                        version.isActive ? "active-version" : ""
                      }`}
                      size="small"
                    >
                      <div className="version-info">
                        <div className="version-header">
                          <Text strong>{version.version}</Text>
                          {version.isActive && <Tag color="green">活跃</Tag>}
                        </div>
                        <div className="version-details">
                          <Text type="secondary">
                            上传时间: {formatDate(version.uploadedAt)}
                          </Text>
                          <Text type="secondary">
                            文件数量: {version.fileCount}
                          </Text>
                          {version.hasSourcemap && (
                            <Text type="success">
                              ✅ 已关联Sourcemap
                              {version.sourcemapVersion && ` (${version.sourcemapVersion})`}
                            </Text>
                          )}
                        </div>
                      </div>
                      <div className="version-actions">
                        <Space>
                          {!version.isActive && (
                            <Tooltip title="设为活跃版本">
                              <Button
                                type="text"
                                icon={<CheckCircleOutlined />}
                                onClick={() =>
                                  handleSetActiveVersion(version.id)
                                }
                              />
                            </Tooltip>
                          )}
                          <Tooltip title="查看文件">
                            <Button
                              type="text"
                              icon={<FolderOutlined />}
                              onClick={() => {
                                setSelectedVersion(version.version);
                                loadFileTree(projectId, version.version);
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="删除版本">
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() =>
                                confirmDeleteVersion(version.version)
                              }
                              disabled={version.isActive}
                            />
                          </Tooltip>
                        </Space>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty description={!projectId ? "请选择项目" : "没有版本"} />
              )}
            </Card>
          </TabPane>
        </Tabs>
      </div>

      {/* 删除确认对话框 */}
      <Modal
        title="确认删除"
        open={deleteModalVisible}
        onOk={handleDeleteVersion}
        onCancel={() => {
          setDeleteModalVisible(false);
          setVersionToDelete("");
        }}
        okText="删除"
        cancelText="取消"
      >
        <p>确定要删除版本 "{versionToDelete}" 吗？此操作不可恢复。</p>
      </Modal>
    </div>
  );
};

export default SourceCodeManager;
