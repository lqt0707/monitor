import React, { useState } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Descriptions,
  Alert,
  Collapse,
  Tag,
  Divider,
  List,
  Tooltip,
  message,
  Spin,
  Empty,
} from "antd";
import {
  FileTextOutlined,
  BugOutlined,
  CodeOutlined,
  BulbOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import "./ComprehensiveAnalysisReport.css";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ComprehensiveAnalysisReportProps {
  error: any;
  aiDiagnosis: any;
  sourceCode: any;
  loading: boolean;
}

const ComprehensiveAnalysisReport: React.FC<
  ComprehensiveAnalysisReportProps
> = ({ error, aiDiagnosis, sourceCode, loading }) => {
  const [expandedPanels, setExpandedPanels] = useState<string[]>([]);

  // 检查是否有综合分析报告
  const hasComprehensiveReport = aiDiagnosis && sourceCode;

  // 处理面板展开/收起
  const handlePanelChange = (keys: string | string[]) => {
    setExpandedPanels(Array.isArray(keys) ? keys : [keys]);
  };

  // 导出报告
  const exportReport = () => {
    if (!aiDiagnosis) {
      message.warning("没有可导出的报告");
      return;
    }

    const reportData = {
      timestamp: new Date().toISOString(),
      error: error,
      aiDiagnosis: aiDiagnosis,
      sourceCode: sourceCode,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error-analysis-report-${error?.id || "unknown"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    message.success("报告导出成功");
  };

  // 分享报告
  const shareReport = () => {
    if (!aiDiagnosis) {
      message.warning("没有可分享的报告");
      return;
    }

    // 生成分享链接
    const shareUrl = `${window.location.origin}/error-analysis/${error?.id}`;

    if (navigator.share) {
      navigator.share({
        title: "错误分析报告",
        text: `错误ID: ${error?.id} - ${error?.errorMessage}`,
        url: shareUrl,
      });
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(shareUrl).then(() => {
        message.success("分享链接已复制到剪贴板");
      });
    }
  };

  if (!hasComprehensiveReport) {
    return (
      <Card className="comprehensive-analysis-card">
        <div className="no-report-state">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text>等待AI诊断完成后自动生成综合分析报告</Text>
                <div className="report-requirements">
                  <Text type="secondary">
                    需要AI诊断结果和源代码信息才能生成综合分析报告
                  </Text>
                </div>
              </div>
            }
          />
        </div>
      </Card>
    );
  }

  return (
    <Card className="comprehensive-analysis-card">
      <div className="report-header">
        <div className="report-title">
          <Title level={4}>
            <BugOutlined /> 综合分析报告
          </Title>
          <Text type="secondary">基于AI诊断、源代码和SourceMap的深度分析</Text>
        </div>
        <div className="report-actions">
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportReport}
              size="small"
            >
              导出报告
            </Button>
            <Button
              icon={<ShareAltOutlined />}
              onClick={shareReport}
              size="small"
            >
              分享
            </Button>
            <Button
              type="primary"
              icon={<BulbOutlined />}
              onClick={() => {}}
              loading={loading}
              size="small"
            >
              重新分析
            </Button>
          </Space>
        </div>
      </div>

      <Divider />

      <Collapse
        activeKey={expandedPanels}
        onChange={handlePanelChange}
        expandIconPosition="end"
        className="analysis-panels"
      >
        {/* 错误根本原因分析 */}
        <Panel
          header={
            <div className="panel-header">
              <ExclamationCircleOutlined className="panel-icon error" />
              <span>错误根本原因分析</span>
              <Tag color="red">核心</Tag>
            </div>
          }
          key="root-cause"
        >
          <div className="root-cause-analysis">
            <Alert
              message="根本原因识别"
              description={
                <div>
                  <Paragraph>
                    <Text strong>主要问题：</Text>
                    {aiDiagnosis.analysis || "AI诊断未提供具体分析"}
                  </Paragraph>

                  {aiDiagnosis.possibleCauses &&
                    aiDiagnosis.possibleCauses.length > 0 && (
                      <div className="causes-list">
                        <Text strong>可能原因：</Text>
                        <List
                          size="small"
                          dataSource={aiDiagnosis.possibleCauses}
                          renderItem={(cause: string, index: number) => (
                            <List.Item>
                              <Tag color="orange">{index + 1}</Tag>
                              {cause}
                            </List.Item>
                          )}
                        />
                      </div>
                    )}

                  <div className="error-context">
                    <Text strong>错误上下文：</Text>
                    <Descriptions
                      column={1}
                      size="small"
                      bordered
                      style={{ marginTop: 8 }}
                    >
                      <Descriptions.Item label="错误类型">
                        <Tag color="red">{error?.type || "未知"}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="错误消息">
                        <Text code>{error?.errorMessage || "无"}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="项目版本">
                        <Text>{error?.projectVersion || "未知"}</Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </div>
              }
              type="error"
              showIcon
            />
          </div>
        </Panel>

        {/* 问题代码精确定位 */}
        <Panel
          header={
            <div className="panel-header">
              <CodeOutlined className="panel-icon code" />
              <span>问题代码精确定位</span>
              <Tag color="blue">定位</Tag>
            </div>
          }
          key="code-location"
        >
          <div className="code-location-analysis">
            <div className="location-details">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="源文件">
                  <Text code copyable>
                    {aiDiagnosis.exactLocation?.file ||
                      error?.sourceFile ||
                      "未知"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="行号">
                  <Text code>
                    {aiDiagnosis.exactLocation?.line ||
                      error?.sourceLine ||
                      "未知"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="列号">
                  <Text code>
                    {aiDiagnosis.exactLocation?.column || "未知"}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="函数名">
                  <Text code>
                    {aiDiagnosis.exactLocation?.function || "未知"}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {sourceCode && (
              <div className="source-code-preview">
                <Divider orientation="left">
                  <FileTextOutlined /> 相关源代码片段
                </Divider>
                <div className="code-snippet">
                  <pre className="source-code">
                    <code>{sourceCode.content || "源代码内容不可用"}</code>
                  </pre>
                </div>
              </div>
            )}

            <div className="sourcemap-info">
              <Alert
                message="SourceMap映射信息"
                description={
                  <div>
                    <Text>当前错误位置已通过SourceMap映射到原始源代码</Text>
                    <br />
                    <Text type="secondary">
                      映射精度：
                      {aiDiagnosis.exactLocation?.column
                        ? "精确到列"
                        : "精确到行"}
                    </Text>
                  </div>
                }
                type="info"
                showIcon
              />
            </div>
          </div>
        </Panel>

        {/* 具体修改建议方案 */}
        <Panel
          header={
            <div className="panel-header">
              <BulbOutlined className="panel-icon solution" />
              <span>具体修改建议方案</span>
              <Tag color="green">解决方案</Tag>
            </div>
          }
          key="fix-suggestions"
        >
          <div className="fix-suggestions-analysis">
            {aiDiagnosis.fixSuggestions &&
            aiDiagnosis.fixSuggestions.length > 0 ? (
              <div className="suggestions-list">
                <List
                  dataSource={aiDiagnosis.fixSuggestions}
                  renderItem={(suggestion: string, index: number) => (
                    <List.Item>
                      <div className="suggestion-item">
                        <Tag color="green" className="suggestion-number">
                          {index + 1}
                        </Tag>
                        <div className="suggestion-content">
                          <Text>{suggestion}</Text>
                          <div className="suggestion-actions">
                            <Space size="small">
                              <Button size="small" type="link">
                                <LinkOutlined /> 查看相关代码
                              </Button>
                              <Button size="small" type="link">
                                <CodeOutlined /> 应用修复
                              </Button>
                            </Space>
                          </div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            ) : (
              <Empty description="暂无具体修复建议" />
            )}

            {aiDiagnosis.preventionMeasures && (
              <div className="prevention-measures">
                <Divider orientation="left">
                  {/* SafetyOutlined is not imported, assuming it's a placeholder or typo */}
                  {/* <SafetyOutlined /> 预防措施 */}
                  <Tag color="blue">预防措施</Tag>
                </Divider>
                <Alert
                  message="长期预防建议"
                  description={aiDiagnosis.preventionMeasures}
                  type="success"
                  showIcon
                />
              </div>
            )}
          </div>
        </Panel>

        {/* 技术细节分析 */}
        <Panel
          header={
            <div className="panel-header">
              <FileTextOutlined className="panel-icon technical" />
              <span>技术细节分析</span>
              <Tag color="purple">技术</Tag>
            </div>
          }
          key="technical-details"
        >
          <div className="technical-details-analysis">
            <div className="confidence-level">
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="诊断置信度">
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{
                        width: `${(aiDiagnosis.confidence || 0.8) * 100}%`,
                        backgroundColor:
                          aiDiagnosis.confidence > 0.8
                            ? "#52c41a"
                            : aiDiagnosis.confidence > 0.6
                            ? "#faad14"
                            : "#ff4d4f",
                      }}
                    />
                  </div>
                  <Text>
                    {Math.round((aiDiagnosis.confidence || 0.8) * 100)}%
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="分析深度">
                  <Tag color="blue">AI + 源码 + SourceMap</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="数据完整性">
                  <Tag color={sourceCode ? "green" : "orange"}>
                    {sourceCode ? "完整" : "部分"}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div className="analysis-metadata">
              <Divider orientation="left">分析元数据</Divider>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="生成时间">
                  <Text>{new Date().toLocaleString()}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="分析引擎">
                  <Text>AI诊断 + 综合分析</Text>
                </Descriptions.Item>
                <Descriptions.Item label="数据源">
                  <Text>错误日志 + AI分析 + 源代码 + SourceMap</Text>
                </Descriptions.Item>
                <Descriptions.Item label="报告版本">
                  <Text>v1.0</Text>
                </Descriptions.Item>
              </Descriptions>
            </div>
          </div>
        </Panel>
      </Collapse>

      <Divider />

      <div className="report-footer">
        <Space>
          <Text type="secondary">
            <ClockCircleOutlined /> 最后更新: {new Date().toLocaleString()}
          </Text>
          <Text type="secondary">
            <CheckCircleOutlined /> 分析状态: 已完成
          </Text>
        </Space>
      </div>
    </Card>
  );
};

export default ComprehensiveAnalysisReport;
