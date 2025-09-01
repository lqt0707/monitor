import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Tree,
  Button,
  Space,
  Spin,
  Empty,
  message,
  Typography,
  Tag,
  Tooltip,
} from "antd";
import {
  FolderOutlined,
  FileOutlined,
  CodeOutlined,
  LinkOutlined,
  SearchOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { DataNode } from "antd/es/tree";
import type { DirectoryTreeProps } from "antd/es/tree/DirectoryTree";
import { fetchSourceCodeFiles } from "../../services/errorSourceCode";
import "./SourceCodeNavigator.css";

const { Title, Text } = Typography;
const { DirectoryTree } = Tree;

// 文件树节点类型
interface FileNode {
  key: string;
  title: string;
  isLeaf: boolean;
  children?: FileNode[];
  path?: string;
  type?: string;
  isErrorFile?: boolean;
  errorLine?: number;
}

interface SourceCodeNavigatorProps {
  projectId: string;
  version: string;
  errorFile?: string;
  errorLine?: number;
  onFileSelect?: (filePath: string, lineNumber?: number) => void;
  onNavigateToManager?: () => void;
  className?: string;
}

const SourceCodeNavigator: React.FC<SourceCodeNavigatorProps> = ({
  projectId,
  version,
  errorFile,
  errorLine,
  onFileSelect,
  onNavigateToManager,
  className = "",
}) => {
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [errorFileFound, setErrorFileFound] = useState(false);

  // 加载文件树
  const loadFileTree = useCallback(async () => {
    if (!projectId || !version) return;

    try {
      setLoading(true);
      const response = await fetchSourceCodeFiles(projectId, version);

      if (response.success && response.data) {
        const files = response.data.files || [];
        const treeData = buildFileTree(files);

        // 标记错误文件
        if (errorFile) {
          markErrorFile(treeData, errorFile, errorLine);
        }

        setTreeData(treeData);

        // 自动展开到错误文件
        if (errorFile) {
          autoExpandToErrorFile(treeData, errorFile);
        }
      } else {
        setTreeData([]);
        message.error(response.message || "加载文件列表失败");
      }
    } catch (error) {
      console.error("加载文件树失败:", error);
      message.error("加载文件列表失败");
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, version, errorFile, errorLine]);

  // 构建文件树结构
  const buildFileTree = (files: any[]): FileNode[] => {
    const pathMap = new Map<string, FileNode>();

    files.forEach((file) => {
      const pathParts = file.filePath.split("/");

      // 为每个路径部分创建节点
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

    // 对每个节点的子节点进行排序
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
    return rootNodes;
  };

  // 标记错误文件
  const markErrorFile = (
    nodes: FileNode[],
    targetFile: string,
    lineNumber?: number
  ) => {
    const markNode = (nodeList: FileNode[]) => {
      nodeList.forEach((node) => {
        if (node.path === targetFile) {
          node.isErrorFile = true;
          node.errorLine = lineNumber;
          setErrorFileFound(true);
        }
        if (node.children) {
          markNode(node.children);
        }
      });
    };
    markNode(nodes);
  };

  // 自动展开到错误文件
  const autoExpandToErrorFile = (nodes: FileNode[], targetFile: string) => {
    const pathParts = targetFile.split("/");
    const expandKeys: string[] = [];

    // 构建需要展开的路径
    for (let i = 1; i < pathParts.length; i++) {
      expandKeys.push(pathParts.slice(0, i).join("/"));
    }

    setExpandedKeys(expandKeys);
    setSelectedKeys([targetFile]);
  };

  // 处理文件选择
  const handleFileSelect: DirectoryTreeProps["onSelect"] = (
    selectedKeys,
    info
  ) => {
    const node = info.node as unknown as FileNode;
    if (node.isLeaf && node.path) {
      setSelectedKeys(selectedKeys as string[]);
      onFileSelect?.(node.path, node.errorLine);
    }
  };

  // 处理文件树展开/收起
  const handleExpand = (expandedKeys: React.Key[]) => {
    setExpandedKeys(expandedKeys as string[]);
  };

  // 跳转到源代码管理页面
  const handleNavigateToManager = () => {
    onNavigateToManager?.();
  };

  // 搜索错误文件
  const scrollToErrorFile = () => {
    if (errorFile && errorFileFound) {
      const errorFileElement = document.querySelector(
        `[data-key="${errorFile}"]`
      );
      if (errorFileElement) {
        errorFileElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  // 自定义树节点渲染
  const renderTreeNode = (node: FileNode) => {
    const isErrorFile = node.isErrorFile;

    return (
      <span className={`tree-node ${isErrorFile ? "error-file" : ""}`}>
        {isErrorFile && <Tag color="red">错误</Tag>}
        {node.title}
        {isErrorFile && node.errorLine && (
          <Text type="secondary" className="error-line-info">
            (第{node.errorLine}行)
          </Text>
        )}
      </span>
    );
  };

  // 监听版本变化，重新加载文件树
  useEffect(() => {
    loadFileTree();
  }, [loadFileTree]);

  // 监听错误文件变化，重新标记
  useEffect(() => {
    if (treeData.length > 0 && errorFile) {
      const newTreeData = [...treeData];
      markErrorFile(newTreeData, errorFile, errorLine);
      setTreeData(newTreeData);

      if (errorFileFound) {
        autoExpandToErrorFile(newTreeData, errorFile);
      }
    }
  }, [errorFile, errorLine]);

  return (
    <Card
      title={
        <Space>
          <CodeOutlined />
          <span>源代码导航</span>
          {errorFileFound && (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              已定位错误文件
            </Tag>
          )}
        </Space>
      }
      className={`source-code-navigator ${className}`}
      extra={
        <Space>
          {errorFileFound && (
            <Tooltip title="定位到错误文件">
              <Button
                size="small"
                icon={<SearchOutlined />}
                onClick={scrollToErrorFile}
              >
                定位
              </Button>
            </Tooltip>
          )}
          <Tooltip title="在源代码管理页面中查看">
            <Button
              size="small"
              icon={<ExternalLinkOutlined />}
              onClick={handleNavigateToManager}
            >
              管理
            </Button>
          </Tooltip>
        </Space>
      }
    >
      {loading ? (
        <div className="navigator-loading">
          <Spin tip="加载文件列表..." />
        </div>
      ) : treeData.length > 0 ? (
        <div className="file-tree-container">
          <DirectoryTree
            showIcon
            defaultExpandAll={false}
            expandedKeys={expandedKeys}
            selectedKeys={selectedKeys}
            onExpand={handleExpand}
            onSelect={handleFileSelect}
            treeData={treeData as unknown as DataNode[]}
            icon={({ isLeaf }) =>
              isLeaf ? <FileOutlined /> : <FolderOutlined />
            }
            titleRender={(node) => renderTreeNode(node as unknown as FileNode)}
            className="source-code-tree"
          />
        </div>
      ) : (
        <Empty
          description={
            !projectId
              ? "请选择项目"
              : !version
              ? "请选择版本"
              : "没有源代码文件"
          }
        />
      )}

      {errorFile && !errorFileFound && (
        <div className="error-file-not-found">
          <Text type="warning">
            <FileSearchOutlined /> 未找到错误文件: {errorFile}
          </Text>
          <Text type="secondary" className="error-file-tip">
            请检查文件路径是否正确，或上传对应版本的源代码
          </Text>
        </div>
      )}
    </Card>
  );
};

export default SourceCodeNavigator;
