import React from 'react';
import {
  Card,
  Typography,
  Descriptions,
  Tag,
  List,
  Divider,
  Space,
  Button,
  Tooltip,
  Alert,
  Collapse,
} from 'antd';
import {
  BugOutlined,
  CodeOutlined,
  FileTextOutlined,
  LinkOutlined,
  SearchOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface RAGAnalysisReportProps {
  ragResult: any;
  loading?: boolean;
}

const RAGAnalysisReport: React.FC<RAGAnalysisReportProps> = ({
  ragResult,
  loading = false,
}) => {
  if (!ragResult) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <SearchOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <Text type="secondary">暂无RAG增强分析报告</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            基于源码检索的智能错误分析功能
          </Text>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <SearchOutlined />
          RAG增强错误分析报告
          <Tag color="blue">AI + 源码检索</Tag>
        </Space>
      }
      loading={loading}
      extra={
        <Space>
          <Tooltip title="基于源码检索的智能分析">
            <FileSearchOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      }
    >
      {/* 错误上下文 */}
      <div className="error-context-section">
        <Title level={4}>
          <BugOutlined /> 错误上下文
        </Title>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="文件路径">
            <Text code copyable>
              {ragResult.errorContext.filePath}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="行号">
            <Text code>{ragResult.errorContext.line}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="列号">
            <Text code>{ragResult.errorContext.column}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="函数名">
            <Text code>{ragResult.errorContext.functionName || 'N/A'}</Text>
          </Descriptions.Item>
        </Descriptions>
        
        {ragResult.errorContext.originalLocation && (
          <>
            <Divider />
            <Alert
              message="SourceMap原始位置"
              description={
                <Space direction="vertical">
                  <Text>原始文件: <Text code>{ragResult.errorContext.originalLocation.file}</Text></Text>
                  <Text>原始行号: <Text code>{ragResult.errorContext.originalLocation.line}</Text></Text>
                  <Text>原始列号: <Text code>{ragResult.errorContext.originalLocation.column}</Text></Text>
                </Space>
              }
              type="info"
              showIcon
            />
          </>
        )}
      </div>

      <Divider />

      {/* 可能原因分析 */}
      <div className="possible-causes-section">
        <Title level={4}>
          <BugOutlined /> 可能原因分析
        </Title>
        {ragResult.possibleCauses && ragResult.possibleCauses.length > 0 ? (
          <List
            size="small"
            dataSource={ragResult.possibleCauses}
            renderItem={(cause: string, index: number) => (
              <List.Item>
                <Tag color="orange">{index + 1}</Tag>
                {cause}
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">暂无可能原因分析</Text>
        )}
      </div>

      <Divider />

      {/* 代码上下文 */}
      <div className="code-context-section">
        <Title level={4}>
          <CodeOutlined /> 代码上下文
        </Title>
        <Collapse defaultActiveKey={['relevant-code', 'imports']}>
          <Panel header="相关代码" key="relevant-code">
            <div className="code-snippet">
              <pre className="source-code">
                <code>{ragResult.codeContext.relevantCode || '暂无相关代码'}</code>
              </pre>
            </div>
          </Panel>
          
          <Panel header="导入依赖" key="imports">
            {ragResult.codeContext.imports && ragResult.codeContext.imports.length > 0 ? (
              <List
                size="small"
                dataSource={ragResult.codeContext.imports}
                renderItem={(importItem: string) => (
                  <List.Item>
                    <Tag color="green">
                      <LinkOutlined /> {importItem}
                    </Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">暂无导入依赖信息</Text>
            )}
          </Panel>
          
          <Panel header="项目依赖" key="dependencies">
            {ragResult.codeContext.dependencies && ragResult.codeContext.dependencies.length > 0 ? (
              <List
                size="small"
                dataSource={ragResult.codeContext.dependencies}
                renderItem={(dependency: string) => (
                  <List.Item>
                    <Tag color="blue">{dependency}</Tag>
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">暂无项目依赖信息</Text>
            )}
          </Panel>
        </Collapse>
      </div>

      <Divider />

      {/* 修复建议 */}
      <div className="fix-suggestions-section">
        <Title level={4}>
          <BugOutlined /> 修复建议
        </Title>
        
        <Collapse defaultActiveKey={['immediate', 'long-term', 'examples']}>
          <Panel header="立即修复方案" key="immediate">
            {ragResult.fixSuggestions.immediate && ragResult.fixSuggestions.immediate.length > 0 ? (
              <List
                size="small"
                dataSource={ragResult.fixSuggestions.immediate}
                renderItem={(suggestion: string, index: number) => (
                  <List.Item>
                    <Tag color="red">紧急</Tag>
                    {suggestion}
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">暂无立即修复方案</Text>
            )}
          </Panel>
          
          <Panel header="长期解决方案" key="long-term">
            {ragResult.fixSuggestions.longTerm && ragResult.fixSuggestions.longTerm.length > 0 ? (
              <List
                size="small"
                dataSource={ragResult.fixSuggestions.longTerm}
                renderItem={(suggestion: string, index: number) => (
                  <List.Item>
                    <Tag color="orange">长期</Tag>
                    {suggestion}
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">暂无长期解决方案</Text>
            )}
          </Panel>
          
          <Panel header="代码示例" key="examples">
            {ragResult.fixSuggestions.codeExamples && ragResult.fixSuggestions.codeExamples.length > 0 ? (
              <List
                size="small"
                dataSource={ragResult.fixSuggestions.codeExamples}
                renderItem={(example: string, index: number) => (
                  <List.Item>
                    <div className="code-example">
                      <Text strong>示例 {index + 1}:</Text>
                      <pre className="source-code">
                        <code>{example}</code>
                      </pre>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">暂无代码示例</Text>
            )}
          </Panel>
        </Collapse>
      </div>

      <Divider />

      {/* 框架特定建议 */}
      <div className="framework-specific-section">
        <Title level={4}>
          <FileTextOutlined /> 框架特定建议
        </Title>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="框架">
            <Tag color="purple">{ragResult.frameworkSpecific.framework}</Tag>
          </Descriptions.Item>
        </Descriptions>
        
        <Collapse defaultActiveKey={['best-practices', 'common-patterns']}>
          <Panel header="最佳实践" key="best-practices">
            {ragResult.frameworkSpecific.bestPractices && ragResult.frameworkSpecific.bestPractices.length > 0 ? (
              <List
                size="small"
                dataSource={ragResult.frameworkSpecific.bestPractices}
                renderItem={(practice: string, index: number) => (
                  <List.Item>
                    <Tag color="green">最佳实践</Tag>
                    {practice}
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">暂无最佳实践建议</Text>
            )}
          </Panel>
          
          <Panel header="常见模式" key="common-patterns">
            {ragResult.frameworkSpecific.commonPatterns && ragResult.frameworkSpecific.commonPatterns.length > 0 ? (
              <List
                size="small"
                dataSource={ragResult.frameworkSpecific.commonPatterns}
                renderItem={(pattern: string, index: number) => (
                  <List.Item>
                    <Tag color="blue">常见模式</Tag>
                    {pattern}
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">暂无常见模式建议</Text>
            )}
          </Panel>
        </Collapse>
      </div>

      <Divider />

      {/* 分析置信度 */}
      <div className="confidence-section">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="分析置信度">
            <div className="confidence-bar">
              <div 
                className="confidence-fill"
                style={{ 
                  width: `${ragResult.confidence * 100}%`,
                  backgroundColor: ragResult.confidence > 0.8 ? '#52c41a' : 
                                ragResult.confidence > 0.6 ? '#faad14' : '#ff4d4f',
                  height: '20px',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }}
              />
              <Text style={{ marginLeft: '8px' }}>
                {(ragResult.confidence * 100).toFixed(1)}%
              </Text>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="分析类型">
            <Tag color="blue">RAG增强分析</Tag>
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Card>
  );
};

export default RAGAnalysisReport;
