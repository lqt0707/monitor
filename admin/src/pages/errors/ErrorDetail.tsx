import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Descriptions,
  Tabs,
  Button,
  Tag,
  Spin,
  Alert,
  Typography,
  Divider,
  Space,
  List,
} from "antd";
import {
  ArrowLeftOutlined,
  BugOutlined,
  CodeOutlined,
  HistoryOutlined,
  UserOutlined,
  GlobalOutlined,
  MobileOutlined,
} from "@ant-design/icons";
import SourceCodeViewer from "../../components/SourceCodeViewer";
import { fetchErrorDetail, fetchErrorSourceCode } from "../../services/api";
import "./ErrorDetail.css";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

// 错误级别映射
const errorLevelMap = {
  1: { color: "green", text: "低" },
  2: { color: "orange", text: "中" },
  3: { color: "red", text: "高" },
  4: { color: "purple", text: "严重" },
};

// 格式化日期时间
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const ErrorDetail: React.FC = () => {
  const { errorId } = useParams<{ errorId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sourceCodeLoading, setSourceCodeLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [sourceCode, setSourceCode] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("1");

  // 获取错误详情
  useEffect(() => {
    const loadErrorDetail = async () => {
      try {
        setLoading(true);
        if (errorId) {
          const response = await fetchErrorDetail(errorId);
          console.log("response:", response);

          if (response) {
            setError(response);
          } else {
            throw new Error("获取错误详情失败");
          }
        }
      } catch (err) {
        console.error("加载错误详情失败:", err);
      } finally {
        setLoading(false);
      }
    };

    loadErrorDetail();
  }, [errorId]);

  // 获取源代码
  const loadSourceCode = async () => {
    if (!error || !error.projectId || !error.projectVersion) {
      return;
    }

    try {
      setSourceCodeLoading(true);
      const response = await fetchErrorSourceCode(errorId);
      if (response.success && response.data) {
        setSourceCode(response.data);
      } else {
        throw new Error(response.message || "获取源代码失败");
      }
    } catch (err) {
      console.error("加载源代码失败:", err);
    } finally {
      setSourceCodeLoading(false);
    }
  };

  // 当切换到源代码标签时加载源代码
  useEffect(() => {
    if (activeTab === "2" && !sourceCode && error) {
      loadSourceCode();
    }
  }, [activeTab, sourceCode, error]);

  // 返回列表
  const handleBack = () => {
    navigate(-1);
  };

  // 解析错误堆栈
  const renderErrorStack = (stack: string) => {
    if (!stack) return <Text type="secondary">无堆栈信息</Text>;

    const lines = stack.split("\n");
    return (
      <List
        size="small"
        bordered
        dataSource={lines}
        renderItem={(line, index) => (
          <List.Item className="stack-line">
            <Text code copyable={index === 0} className="stack-text">
              {line}
            </Text>
          </List.Item>
        )}
      />
    );
  };

  // 渲染设备信息
  const renderDeviceInfo = (deviceInfo: any) => {
    if (!deviceInfo) return <Text type="secondary">无设备信息</Text>;

    let deviceData = deviceInfo;
    if (typeof deviceInfo === "string") {
      try {
        deviceData = JSON.parse(deviceInfo);
      } catch (e) {
        return <Text>{deviceInfo}</Text>;
      }
    }

    return (
      <Descriptions column={1} bordered size="small">
        {Object.entries(deviceData).map(([key, value]) => (
          <Descriptions.Item key={key} label={key}>
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </Descriptions.Item>
        ))}
      </Descriptions>
    );
  };

  if (loading) {
    return (
      <div className="error-detail-loading">
        <Spin size="large" tip="加载错误详情..." />
      </div>
    );
  }

  if (!error) {
    return (
      <Alert
        message="错误"
        description="未找到错误详情或加载失败"
        type="error"
        showIcon
        action={
          <Button size="small" type="primary" onClick={handleBack}>
            返回列表
          </Button>
        }
      />
    );
  }

  const errorLevel = errorLevelMap[
    error.errorLevel as keyof typeof errorLevelMap
  ] || { color: "default", text: "未知" };

  return (
    <div className="error-detail-container">
      <div className="error-detail-header">
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="back-button"
        >
          返回列表
        </Button>
        <Title level={4} className="error-title">
          <BugOutlined /> 错误详情
          <Tag color={errorLevel.color} className="error-level-tag">
            {errorLevel.text}
          </Tag>
        </Title>
      </div>

      <Card className="error-summary-card">
        <Descriptions
          title="错误概要"
          bordered
          column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="错误消息">
            {error.errorMessage}
          </Descriptions.Item>
          <Descriptions.Item label="错误类型">{error.type}</Descriptions.Item>
          <Descriptions.Item label="项目ID">
            {error.projectId}
          </Descriptions.Item>
          <Descriptions.Item label="版本">
            {error.projectVersion || "未知"}
          </Descriptions.Item>
          <Descriptions.Item label="发生时间">
            {formatDateTime(error.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label="源文件">
            {error.sourceFile || "未知"}
          </Descriptions.Item>
          <Descriptions.Item label="行号">
            {error.sourceLine || "未知"}
          </Descriptions.Item>
          <Descriptions.Item label="列号">
            {error.sourceColumn || "未知"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="error-detail-tabs"
      >
        <TabPane
          tab={
            <span>
              <HistoryOutlined />
              错误堆栈
            </span>
          }
          key="1"
        >
          <Card title="错误堆栈信息" className="stack-card">
            {renderErrorStack(error.errorStack)}
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <CodeOutlined />
              源代码
            </span>
          }
          key="2"
        >
          {sourceCodeLoading ? (
            <div className="source-code-loading">
              <Spin tip="加载源代码..." />
            </div>
          ) : sourceCode ? (
            <div className="source-code-container">
              <Card title="源代码位置" className="source-location-card">
                <Descriptions
                  bordered
                  column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}
                >
                  <Descriptions.Item label="原始文件">
                    {sourceCode.resolvedFrames?.[0]?.originalSource ||
                      error.sourceFile ||
                      "未知"}
                  </Descriptions.Item>
                  <Descriptions.Item label="原始行号">
                    {sourceCode.resolvedFrames?.[0]?.originalLine ||
                      error.sourceLine ||
                      "未知"}
                  </Descriptions.Item>
                  <Descriptions.Item label="原始列号">
                    {sourceCode.resolvedFrames?.[0]?.originalColumn ||
                      error.sourceColumn ||
                      "未知"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {sourceCode.sourceCode?.content ? (
                <SourceCodeViewer
                  code={sourceCode.sourceCode.content}
                  fileName={
                    sourceCode.resolvedFrames?.[0]?.originalSource ||
                    error.sourceFile
                  }
                  errorLine={
                    sourceCode.resolvedFrames?.[0]?.originalLine ||
                    error.sourceLine
                  }
                  darkMode={true}
                  showLineNumbers={true}
                />
              ) : (
                <Alert
                  message="源代码定位成功，但未找到源代码内容"
                  description={
                    <div>
                      <p>系统已成功解析错误位置，但未找到对应的源代码文件。</p>
                      <p>
                        <strong>可能的原因：</strong>
                      </p>
                      <ul>
                        <li>
                          未上传对应版本（{error.projectVersion}）的源代码文件
                        </li>
                        <li>未上传对应的 sourcemap 文件</li>
                        <li>sourcemap 文件路径配置不正确</li>
                      </ul>
                      <p>
                        <strong>解决方案：</strong>
                      </p>
                      <ul>
                        <li>上传项目源代码到服务器</li>
                        <li>确保 sourcemap 文件与编译后的 JS 文件对应</li>
                        <li>检查项目版本号是否正确</li>
                      </ul>
                      {sourceCode.resolvedFrames?.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <strong>解析结果：</strong>
                          <ul>
                            {sourceCode.resolvedFrames.map(
                              (frame: any, index: number) => (
                                <li key={index}>
                                  {frame.originalSource || frame.fileName}
                                  {frame.originalLine &&
                                    `:${frame.originalLine}`}
                                  {frame.originalColumn &&
                                    `:${frame.originalColumn}`}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  }
                  type="warning"
                  showIcon
                />
              )}
            </div>
          ) : (
            <div className="no-source-code">
              <Alert
                message="未加载源代码"
                description={
                  <>
                    <p>
                      {error.projectVersion
                        ? "此错误有版本信息，但尚未加载源代码。"
                        : "此错误缺少版本信息，无法准确定位源代码。"}
                    </p>
                    <Button
                      type="primary"
                      onClick={loadSourceCode}
                      disabled={!error.projectVersion}
                    >
                      加载源代码
                    </Button>
                  </>
                }
                type="info"
                showIcon
              />
            </div>
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              <UserOutlined />
              用户信息
            </span>
          }
          key="3"
        >
          <Card title="用户与环境信息">
            <Descriptions
              bordered
              column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}
            >
              <Descriptions.Item label="用户ID">
                {error.userId || "未知"}
              </Descriptions.Item>
              <Descriptions.Item label="页面URL">
                {error.pageUrl || "未知"}
              </Descriptions.Item>
              <Descriptions.Item label="User Agent">
                {error.userAgent || "未知"}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">设备信息</Divider>
            {renderDeviceInfo(error.deviceInfo)}

            <Divider orientation="left">网络信息</Divider>
            {renderDeviceInfo(error.networkInfo)}
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ErrorDetail;
