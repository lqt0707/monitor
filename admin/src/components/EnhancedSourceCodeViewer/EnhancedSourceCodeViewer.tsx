import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  Space,
  Button,
  Typography,
  Tooltip,
  Divider,
  Alert,
  Tag,
} from "antd";
import {
  CodeOutlined,
  CopyOutlined,
  ExpandOutlined,
  CompressOutlined,
  FileTextOutlined,
  BugOutlined,
  EyeOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import SourceCodeViewer from "../SourceCodeViewer";
import SourceCodeNavigator from "../SourceCodeNavigator";
import "./EnhancedSourceCodeViewer.css";

const { Title, Text, Paragraph } = Typography;

interface EnhancedSourceCodeViewerProps {
  code: string;
  fileName?: string;
  errorLine?: number;
  projectId?: string;
  version?: string;
  errorFile?: string;
  onFileSelect?: (filePath: string, lineNumber?: number) => void;
  onNavigateToManager?: () => void;
  className?: string;
  showNavigator?: boolean;
}

const EnhancedSourceCodeViewer: React.FC<EnhancedSourceCodeViewerProps> = ({
  code,
  fileName,
  errorLine,
  projectId,
  version,
  errorFile,
  onFileSelect,
  onNavigateToManager,
  className = "",
  showNavigator = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showNavigatorPanel, setShowNavigatorPanel] = useState(showNavigator);
  const [currentFile, setCurrentFile] = useState(fileName || "");
  const [currentLine, setCurrentLine] = useState(errorLine);

  const viewerRef = useRef<HTMLDivElement>(null);

  // 同步外部传入的文件信息
  useEffect(() => {
    if (fileName !== currentFile) {
      setCurrentFile(fileName || "");
    }
    if (errorLine !== currentLine) {
      setCurrentLine(errorLine);
    }
  }, [fileName, errorLine]);

  // 处理文件选择
  const handleFileSelect = (filePath: string, lineNumber?: number) => {
    setCurrentFile(filePath);
    setCurrentLine(lineNumber);
    onFileSelect?.(filePath, lineNumber);
  };

  // 切换导航器面板显示
  const toggleNavigatorPanel = () => {
    setShowNavigatorPanel(!showNavigatorPanel);
  };

  // 切换全屏模式
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // 复制文件路径
  const copyFilePath = () => {
    if (currentFile) {
      navigator.clipboard.writeText(currentFile);
      // 可以添加复制成功的提示
    }
  };

  // 渲染错误位置信息
  const renderErrorLocation = () => {
    if (!currentLine) return null;

    return (
      <div className="error-location-info">
        <Space size="small">
          <BugOutlined style={{ color: "#ff4d4f" }} />
          <Text strong>错误位置：</Text>
          <Tag color="red" icon={<BugOutlined />}>
            第 {currentLine} 行
          </Tag>
          {currentFile && (
            <Text code copyable>
              {currentFile}
            </Text>
          )}
        </Space>
      </div>
    );
  };

  // 渲染文件信息
  const renderFileInfo = () => {
    if (!currentFile) return null;

    return (
      <div className="file-info">
        <Space size="small">
          <FileTextOutlined />
          <Text strong>当前文件：</Text>
          <Text code>{currentFile}</Text>
          <Tooltip title="复制文件路径">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={copyFilePath}
            />
          </Tooltip>
        </Space>
      </div>
    );
  };

  // 渲染源代码导航器
  const renderSourceCodeNavigator = () => {
    if (!showNavigatorPanel || !projectId || !version) return null;

    return (
      <div className="navigator-panel">
        <SourceCodeNavigator
          projectId={projectId}
          version={version}
          errorFile={errorFile || currentFile}
          errorLine={currentLine}
          onFileSelect={handleFileSelect}
          onNavigateToManager={onNavigateToManager}
        />
      </div>
    );
  };

  return (
    <div
      className={`enhanced-source-code-viewer ${
        expanded ? "expanded" : ""
      } ${className}`}
    >
      {/* 头部信息 */}
      <Card
        className="viewer-header"
        size="small"
        title={
          <Space>
            <CodeOutlined />
            <span>源代码查看器</span>
            {currentFile && (
              <Tag color="blue" icon={<FileTextOutlined />}>
                {currentFile.split("/").pop()}
              </Tag>
            )}
          </Space>
        }
        extra={
          <Space>
            {renderErrorLocation()}
            <Tooltip title={showNavigatorPanel ? "隐藏导航器" : "显示导航器"}>
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={toggleNavigatorPanel}
                type={showNavigatorPanel ? "default" : "primary"}
              />
            </Tooltip>
            <Tooltip title={expanded ? "退出全屏" : "全屏显示"}>
              <Button
                size="small"
                icon={expanded ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={toggleExpanded}
              />
            </Tooltip>
            {onNavigateToManager && (
              <Tooltip title="在源代码管理页面中查看">
                <Button
                  size="small"
                  icon={<LinkOutlined />}
                  onClick={onNavigateToManager}
                />
              </Tooltip>
            )}
          </Space>
        }
      >
        {renderFileInfo()}
      </Card>

      {/* 主要内容区域 */}
      <div className="viewer-content" ref={viewerRef}>
        <div className="content-layout">
          {/* 源代码导航器 */}
          {renderSourceCodeNavigator()}

          {/* 源代码显示区域 */}
          <div className="code-display-area">
            <SourceCodeViewer
              code={code}
              fileName={currentFile}
              errorLine={currentLine}
              darkMode={true}
              showLineNumbers={true}
              contextLines={10}
            />
          </div>
        </div>
      </div>

      {/* 版本信息提示 */}
      {projectId && version && (
        <div className="version-info">
          <Alert
            message={
              <Space>
                <span>源代码版本：{version}</span>
                <Tag color="green" size="small">
                  已关联
                </Tag>
              </Space>
            }
            type="info"
            showIcon
            size="small"
          />
        </div>
      )}

      {/* 错误文件未找到提示 */}
      {errorFile && !code && (
        <div className="error-file-alert">
          <Alert
            message="源代码文件未找到"
            description={
              <div>
                <p>系统无法找到错误对应的源代码文件：{errorFile}</p>
                <p>可能的原因：</p>
                <ul>
                  <li>未上传对应版本的源代码文件</li>
                  <li>文件路径不匹配</li>
                  <li>版本号不一致</li>
                </ul>
                <p>建议：</p>
                <ul>
                  <li>检查源代码版本是否与错误版本一致</li>
                  <li>重新上传源代码文件</li>
                  <li>验证文件路径配置</li>
                </ul>
              </div>
            }
            type="warning"
            showIcon
          />
        </div>
      )}
    </div>
  );
};

export default EnhancedSourceCodeViewer;
