import React, { useState, useEffect } from "react";
import {
  Card,
  Space,
  Button,
  Typography,
  Tag,
  Alert,
  Divider,
  Tooltip,
} from "antd";
import {
  CodeOutlined,
  FileTextOutlined,
  BugOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { validateSourceCodeVersion } from "../../services/sourceCodeLocation";
import "./SourceCodeLocation.css";

const { Title, Text, Paragraph } = Typography;

interface SourceCodeLocationProps {
  projectId: string;
  version: string;
  errorFile?: string;
  errorLine?: number;
  errorColumn?: number;
  className?: string;
}

const SourceCodeLocation: React.FC<SourceCodeLocationProps> = ({
  projectId,
  version,
  errorFile,
  errorLine,
  errorColumn,
  className = "",
}) => {
  const navigate = useNavigate();
  const [versionValidation, setVersionValidation] = useState<{
    isValid: boolean;
    availableVersions: string[];
    suggestedVersion?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // 验证源代码版本
  useEffect(() => {
    if (projectId && version) {
      validateVersion();
    }
  }, [projectId, version]);

  const validateVersion = async () => {
    try {
      setLoading(true);
      const result = await validateSourceCodeVersion(projectId, version);
      setVersionValidation(result);
    } catch (error) {
      console.error("验证版本失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 跳转到源代码管理页面
  const navigateToSourceCodeManager = () => {
    navigate("/source-code", {
      state: {
        projectId,
        version,
        highlightFile: errorFile,
      },
    });
  };

  // 渲染版本状态
  const renderVersionStatus = () => {
    if (!versionValidation) return null;

    if (versionValidation.isValid) {
      return (
        <Alert
          message={
            <Space>
              <CheckCircleOutlined style={{ color: "#52c41a" }} />
              <span>源代码版本匹配</span>
              <Tag color="green">版本 {version}</Tag>
            </Space>
          }
          type="success"
          showIcon={false}
          size="small"
        />
      );
    }

    return (
      <Alert
        message={
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <Space>
              <ExclamationCircleOutlined style={{ color: "#faad14" }} />
              <span>源代码版本不匹配</span>
              <Tag color="orange">错误版本 {version}</Tag>
            </Space>
            {versionValidation.suggestedVersion && (
              <div>
                <Text type="secondary">建议使用版本：</Text>
                <Tag color="blue">{versionValidation.suggestedVersion}</Tag>
              </div>
            )}
            <div>
              <Text type="secondary">可用版本：</Text>
              {versionValidation.availableVersions.slice(0, 3).map((v) => (
                <Tag key={v} size="small">
                  {v}
                </Tag>
              ))}
              {versionValidation.availableVersions.length > 3 && (
                <Text type="secondary">
                  等 {versionValidation.availableVersions.length} 个版本
                </Text>
              )}
            </div>
          </Space>
        }
        type="warning"
        showIcon={false}
        size="small"
      />
    );
  };

  // 渲染错误位置信息
  const renderErrorLocation = () => {
    if (!errorFile) return null;

    return (
      <div className="error-location-info">
        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <Space>
            <BugOutlined style={{ color: "#ff4d4f" }} />
            <Text strong>错误位置：</Text>
            <Text code>{errorFile}</Text>
          </Space>
          <Space>
            <Text type="secondary">行号：</Text>
            <Tag color="red">{errorLine || "未知"}</Tag>
            {errorColumn && (
              <>
                <Text type="secondary">列号：</Text>
                <Tag color="red">{errorColumn}</Tag>
              </>
            )}
          </Space>
        </Space>
      </div>
    );
  };

  // 渲染操作按钮
  const renderActions = () => {
    return (
      <Space>
        <Button
          type="primary"
          icon={<CodeOutlined />}
          onClick={navigateToSourceCodeManager}
          disabled={!versionValidation?.isValid}
        >
          查看源代码
        </Button>
        <Button
          icon={<FileTextOutlined />}
          onClick={navigateToSourceCodeManager}
        >
          源代码管理
        </Button>
        <Tooltip title="刷新版本验证">
          <Button
            icon={<InfoCircleOutlined />}
            loading={loading}
            onClick={validateVersion}
          />
        </Tooltip>
      </Space>
    );
  };

  return (
    <Card
      title={
        <Space>
          <CodeOutlined />
          <span>源代码定位</span>
          {errorFile && (
            <Tag color="blue" icon={<FileTextOutlined />}>
              已定位
            </Tag>
          )}
        </Space>
      }
      className={`source-code-location ${className}`}
      extra={renderActions()}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {/* 版本状态 */}
        {renderVersionStatus()}

        {/* 错误位置信息 */}
        {renderErrorLocation()}

        {/* 分隔线 */}
        <Divider style={{ margin: "12px 0" }} />

        {/* 说明信息 */}
        <div className="location-description">
          <Paragraph type="secondary" style={{ margin: 0 }}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            系统将自动定位错误对应的源代码文件，支持版本管理和文件浏览。
            {!versionValidation?.isValid && (
              <Text type="warning" style={{ marginLeft: 8 }}>
                当前错误版本与源代码版本不匹配，可能影响定位准确性。
              </Text>
            )}
          </Paragraph>
        </div>
      </Space>
    </Card>
  );
};

export default SourceCodeLocation;
