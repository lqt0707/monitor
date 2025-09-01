import React, { useState, useEffect } from 'react';
import { Card, Button, message, Typography, Space, Alert, Spin } from 'antd';
import { EyeOutlined, CodeOutlined } from '@ant-design/icons';
import { useErrorSourceCode } from '../hooks/useErrorSourceCode';
import type { SourceCodeLocationResult } from '@/types/sourceCodeSourcemapIntegration';

const { Title, Text, Paragraph } = Typography;

interface ErrorInfo {
  projectId: string;
  version: string;
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  errorMessage: string;
  stackTrace?: string;
}

interface ErrorSourceCodeLocatorProps {
  errorInfo: ErrorInfo;
  onLocationFound?: (location: SourceCodeLocationResult['data']) => void;
}

const ErrorSourceCodeLocator: React.FC<ErrorSourceCodeLocatorProps> = ({
  errorInfo,
  onLocationFound,
}) => {
  // 使用自定义hooks替代useRequest
  const {
    locationResult,
    loading: locating,
    preparingAI,
    error,
    locate,
    prepareAI,
    clearErrorMessage,
  } = useErrorSourceCode();

  // 自动触发定位
  useEffect(() => {
    if (errorInfo.projectId && errorInfo.version) {
      handleLocate();
    }
  }, [errorInfo.projectId, errorInfo.version]);

  // 错误处理
  useEffect(() => {
    if (error) {
      message.error(error);
      clearErrorMessage();
    }
  }, [error, clearErrorMessage]);

  // 处理定位
  const handleLocate = async () => {
    const result = await locate(errorInfo);
    if (result && result.success && result.data && onLocationFound) {
      onLocationFound(result.data);
    }
  };

  // 处理AI上下文准备
  const handlePrepareAI = async () => {
    const success = await prepareAI(errorInfo);
    if (success) {
      message.success('AI诊断上下文准备完成');
    }
  };

  if (locating) {
    return (
      <Card size="small">
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary">正在定位源代码...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (!locationResult) {
    return (
      <Card size="small">
        <Alert
          message="源代码定位"
          description="点击按钮开始定位错误对应的源代码位置"
          type="info"
          showIcon
        />
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={handleLocate}
          >
            开始定位
          </Button>
        </div>
      </Card>
    );
  }

  if (!locationResult.success) {
    return (
      <Card size="small">
        <Alert
          message="定位失败"
          description={locationResult.message || '无法定位到源代码位置'}
          type="warning"
          showIcon
        />
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={handleLocate}
          >
            重试定位
          </Button>
        </div>
      </Card>
    );
  }

  const locationData = locationResult.data;
  if (!locationData) {
    return (
      <Card size="small">
        <Alert
          message="未找到源代码"
          description="无法找到对应的源代码文件，请确保已上传正确的源代码和sourcemap"
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card 
      size="small" 
      title={
        <Space>
          <CodeOutlined />
          <span>源代码定位结果</span>
        </Space>
      }
      extra={
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          loading={preparingAI}
          onClick={handlePrepareAI}
        >
          准备AI诊断
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 原始错误位置 */}
        <div>
          <Text strong>原始错误位置：</Text>
          <Text code>
            {errorInfo.fileName}:{errorInfo.lineNumber}
            {errorInfo.columnNumber ? `:${errorInfo.columnNumber}` : ''}
          </Text>
        </div>

        {/* 映射后源代码位置 */}
        <div>
          <Text strong>映射后位置：</Text>
          <Text code>
            {locationData.sourceFile}:{locationData.sourceLine}
            {locationData.sourceColumn ? `:${locationData.sourceColumn}` : ''}
          </Text>
        </div>

        {/* 函数信息 */}
        {locationData.functionName && (
          <div>
            <Text strong>函数名：</Text>
            <Text code>{locationData.functionName}</Text>
          </div>
        )}

        {/* 源代码预览 */}
        {locationData.sourceContent && (
          <div>
            <Text strong>源代码预览：</Text>
            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: 12,
                borderRadius: 6,
                fontFamily: 'monospace',
                fontSize: 12,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              {locationData.contextLines?.map((line: string, index: number) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: index === (locationData.contextLines?.length || 0) - 1 
                      ? '#fff2e8' 
                      : 'transparent',
                    padding: '2px 4px',
                  }}
                >
                  {line}
                </div>
              )) || locationData.sourceContent}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{ textAlign: 'center' }}>
          <Space>
            <Button
              type="default"
              size="small"
              onClick={locateSourceCode}
            >
              重新定位
            </Button>
            <Button
              type="primary"
              size="small"
              loading={preparingAI}
              onClick={prepareAIContext}
            >
              准备AI诊断
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  );
};

export default ErrorSourceCodeLocator;