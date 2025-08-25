import React, { useState } from "react";
import {
  Upload,
  Button,
  message,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Progress,
  Alert,
  Divider,
  List,
  Tag,
  Select,
} from "antd";
import { UploadOutlined, FileTextOutlined, FolderOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { apiClient } from "../services/api";
import type {
  UploadSourceCodeRequest,
  UploadSourceCodeResponse,
  SourceCodeAnalysis,
} from "../types/source-code";

const { Title, Text } = Typography;

interface SourceCodeUploadProps {
  /** 项目ID */
  projectId?: string;
  /** 是否显示批量上传选项 */
  showBatchUpload?: boolean;
  /** 上传完成回调 */
  onUploadComplete?: (result: UploadSourceCodeResponse) => void;
}

/**
 * 源代码上传组件
 * 支持单个文件和批量文件上传，提供源代码分析功能
 */
export const SourceCodeUpload: React.FC<SourceCodeUploadProps> = ({
  projectId,
  showBatchUpload = true,
  onUploadComplete,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'single' | 'batch' | 'archive'>('single');
  const [archiveType, setArchiveType] = useState<string>('zip');
  const [analysisResult, setAnalysisResult] =
    useState<UploadSourceCodeResponse | null>(null);

  /**
   * 处理文件上传
   */
  const handleUpload = async (file: File) => {
    if (!projectId) {
      message.error("请先选择项目");
      return false;
    }

    setUploading(true);

    try {
      if (uploadType === 'archive') {
        // 处理压缩包上传
        const content = await readFileAsBase64(file);
        const result = await apiClient.sourceCode.uploadArchive({
          projectId,
          archive: content,
          fileName: file.name,
          archiveType,
        });

        setAnalysisResult({
          id: Date.now().toString(),
          analysis: {
            complexity: { cyclomaticComplexity: 0, linesOfCode: 0, functionCount: 0, averageFunctionLength: 0 },
            security: { vulnerabilityCount: 0, vulnerabilities: [] },
            codeStyle: { issueCount: 0, issues: [] },
            dependencies: { dependencyCount: 0, dependencies: [] }
          },
          triggeredAlerts: [],
          uploadedAt: new Date().toISOString()
        });
        
        onUploadComplete?.(result);
        message.success(`压缩包 ${file.name} 上传成功，处理了 ${result.totalFiles} 个文件`);
      } else {
        // 处理单个文件上传
        const content = await readFileContent(file);

        // 构建上传请求
        const request: UploadSourceCodeRequest = {
          projectId,
          sourceCode: content,
          fileName: file.name,
        };

        // 调用API上传
        const result = await apiClient.sourceCode.upload(request);

        setAnalysisResult(result);
        onUploadComplete?.(result);
        message.success(`文件 ${file.name} 上传成功`);
      }
    } catch (error: any) {
      console.error("上传失败:", error);
      message.error(`文件上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }

    return false; // 阻止默认上传行为
  };

  /**
   * 读取文件内容为base64
   */
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  /**
   * 读取文件内容为base64（不带data URL前缀）
   */
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // 移除data URL前缀
        const base64 = result.replace(/^data:.+;base64,/, '');
        resolve(base64);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  /**
   * 上传配置
   */
  const uploadProps: UploadProps = {
    beforeUpload: handleUpload,
    showUploadList: false,
    multiple: uploadType === 'batch' || uploadType === 'archive',
    accept: uploadType === 'archive' 
      ? ".zip,.tar,.gz,.rar,.7z" 
      : ".js,.ts,.jsx,.tsx,.vue,.css,.scss,.less,.html,.json,.xml,.yaml,.yml,.md",
    maxCount: uploadType === 'batch' ? 10 : 1,
  };

  /**
   * 渲染复杂度分析结果
   */
  const renderComplexityAnalysis = (
    analysis: SourceCodeAnalysis["complexity"]
  ) => (
    <Card size="small" title="代码复杂度分析">
      <Row gutter={16}>
        <Col span={12}>
          <Text>圈复杂度: </Text>
          <Tag color={analysis.cyclomaticComplexity > 10 ? "red" : "green"}>
            {analysis.cyclomaticComplexity}
          </Tag>
        </Col>
        <Col span={12}>
          <Text>代码行数: </Text>
          <Tag>{analysis.linesOfCode}</Tag>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 8 }}>
        <Col span={12}>
          <Text>函数数量: </Text>
          <Tag>{analysis.functionCount}</Tag>
        </Col>
        <Col span={12}>
          <Text>平均函数长度: </Text>
          <Tag>{analysis.averageFunctionLength.toFixed(1)}</Tag>
        </Col>
      </Row>
    </Card>
  );

  /**
   * 渲染安全漏洞分析结果
   */
  const renderSecurityAnalysis = (analysis: SourceCodeAnalysis["security"]) => (
    <Card size="small" title="安全漏洞检测">
      <Space direction="vertical" style={{ width: "100%" }}>
        <div>
          <Text>漏洞数量: </Text>
          <Tag color={analysis.vulnerabilityCount > 0 ? "red" : "green"}>
            {analysis.vulnerabilityCount}
          </Tag>
        </div>
        {analysis.vulnerabilityCount > 0 && (
          <List
            size="small"
            dataSource={analysis.vulnerabilities}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag
                        color={
                          item.severity === "critical"
                            ? "red"
                            : item.severity === "high"
                            ? "orange"
                            : item.severity === "medium"
                            ? "yellow"
                            : "green"
                        }
                      >
                        {item.severity.toUpperCase()}
                      </Tag>
                      {item.type}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">{item.description}</Text>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        位置: {item.location}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Space>
    </Card>
  );

  /**
   * 渲染代码规范分析结果
   */
  const renderCodeStyleAnalysis = (
    analysis: SourceCodeAnalysis["codeStyle"]
  ) => (
    <Card size="small" title="代码规范检查">
      <Space direction="vertical" style={{ width: "100%" }}>
        <div>
          <Text>规范问题: </Text>
          <Tag color={analysis.issueCount > 0 ? "orange" : "green"}>
            {analysis.issueCount}
          </Tag>
        </div>
        {analysis.issueCount > 0 && (
          <List
            size="small"
            dataSource={analysis.issues}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.type}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary">{item.description}</Text>
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        位置: {item.location}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Space>
    </Card>
  );

  /**
   * 渲染依赖分析结果
   */
  const renderDependencyAnalysis = (
    analysis: SourceCodeAnalysis["dependencies"]
  ) => (
    <Card size="small" title="依赖分析">
      <Space direction="vertical" style={{ width: "100%" }}>
        <div>
          <Text>依赖数量: </Text>
          <Tag>{analysis.dependencyCount}</Tag>
        </div>
        {analysis.dependencyCount > 0 && (
          <List
            size="small"
            dataSource={analysis.dependencies}
            renderItem={(item) => (
              <List.Item>
                <Tag color={item.type === "production" ? "blue" : "purple"}>
                  {item.type === "production" ? "生产依赖" : "开发依赖"}
                </Tag>
                <Text strong>{item.name}</Text>
                <Text type="secondary">@{item.version}</Text>
              </List.Item>
            )}
          />
        )}
      </Space>
    </Card>
  );

  /**
   * 渲染告警信息
   */
  const renderAlerts = () => {
    if (!analysisResult?.triggeredAlerts?.length) return null;

    return (
      <Card size="small" title="触发的告警">
        <List
          dataSource={analysisResult.triggeredAlerts}
          renderItem={(alert) => (
            <List.Item>
              <Alert
                type={
                  alert.level === "critical"
                    ? "error"
                    : alert.level === "high"
                    ? "warning"
                    : alert.level === "medium"
                    ? "info"
                    : "success"
                }
                message={
                  <Space direction="vertical" size={0}>
                    <Text strong>{alert.ruleName}</Text>
                    <Text type="secondary">{alert.message}</Text>
                  </Space>
                }
                showIcon
              />
            </List.Item>
          )}
        />
      </Card>
    );
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>源代码上传与分析</span>
          </Space>
        }
        loading={uploading}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          {/* 上传类型选择 */}
          {showBatchUpload && (
            <Row gutter={16} align="middle">
              <Col>
                <span>上传类型:</span>
              </Col>
              <Col>
                <Select
                  value={uploadType}
                  onChange={setUploadType}
                  style={{ width: 120 }}
                  disabled={uploading}
                >
                  <Select.Option value="single">单个文件</Select.Option>
                  <Select.Option value="batch">批量文件</Select.Option>
                  <Select.Option value="archive">压缩包</Select.Option>
                </Select>
              </Col>

              {uploadType === 'archive' && (
                <>
                  <Col>
                    <span>压缩格式:</span>
                  </Col>
                  <Col>
                    <Select
                      value={archiveType}
                      onChange={setArchiveType}
                      style={{ width: 100 }}
                      disabled={uploading}
                    >
                      <Select.Option value="zip">ZIP</Select.Option>
                      <Select.Option value="tar">TAR</Select.Option>
                      <Select.Option value="gz">GZ</Select.Option>
                      <Select.Option value="rar">RAR</Select.Option>
                      <Select.Option value="7z">7Z</Select.Option>
                    </Select>
                  </Col>
                </>
              )}
            </Row>
          )}

          {/* 上传说明 */}
          {uploadType === 'single' && (
            <Alert
              message="支持上传单个源代码文件，自动进行安全分析和复杂度检测"
              type="info"
              showIcon
            />
          )}

          {uploadType === 'batch' && (
            <Alert
              message="支持批量上传多个源代码文件，最多10个文件"
              type="info"
              showIcon
            />
          )}

          {uploadType === 'archive' && (
            <Alert
              message={`支持上传${archiveType.toUpperCase()}格式的压缩包，自动解压并分析其中的源代码文件`}
              type="info"
              showIcon
            />
          )}

          <Upload {...uploadProps}>
            <Button
              icon={uploadType === 'archive' ? <FolderOutlined /> : <UploadOutlined />}
              disabled={!projectId || uploading}
            >
              {uploading ? "上传中..." : 
                uploadType === 'archive' ? "选择压缩包" :
                uploadType === 'batch' ? "选择文件（支持多选）" : "选择文件"}
            </Button>
          </Upload>

          {!projectId && (
            <Alert
              type="warning"
              message="请先选择项目"
              description="需要选择项目后才能上传源代码文件"
              showIcon
            />
          )}

          {uploading && (
            <Progress percent={50} status="active" showInfo={false} />
          )}
        </Space>

        {analysisResult && (
          <>
            <Divider />
            <Title level={4}>分析结果</Title>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                {renderComplexityAnalysis(analysisResult.analysis.complexity)}
              </Col>
              <Col span={12}>
                {renderSecurityAnalysis(analysisResult.analysis.security)}
              </Col>
              <Col span={12}>
                {renderCodeStyleAnalysis(analysisResult.analysis.codeStyle)}
              </Col>
              <Col span={12}>
                {renderDependencyAnalysis(analysisResult.analysis.dependencies)}
              </Col>
            </Row>

            {renderAlerts()}
          </>
        )}
      </Card>
    </div>
  );
};
