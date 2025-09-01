import React, { useState, useCallback } from 'react';
import {
  Upload,
  Button,
  message,
  Card,
  Space,
  Typography,
  Divider,
  List,
  Progress,
  Alert,
  Tag,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  UploadOutlined,
  FileZipOutlined,
  CodeOutlined,
  SafetyCertificateOutlined,
  CloudUploadOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';

const { Title, Text, Paragraph } = Typography;

// 上传类型
export enum UploadType {
  COMBINED = 'combined',      // 源代码+sourcemap混合包
  SOURCEMAP_ONLY = 'sourcemap_only', // 仅sourcemap文件
  SOURCE_CODE_ONLY = 'source_code_only' // 仅源代码
}

// 构建信息接口
interface BuildInfo {
  projectId: string;
  version: string;
  buildId: string;
  buildTime: string;
  buildType: string;
  sourcemapCount: number;
  files: Array<{
    path: string;
    size: number;
    type: 'source' | 'sourcemap';
  }>;
}

// 验证结果接口
interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  buildInfo?: BuildInfo;
  fileCount: number;
  sourcemapCount: number;
  sourceCodeCount: number;
}

// 上传状态接口
interface UploadState {
  files: UploadFile[];
  uploadType: UploadType;
  isUploading: boolean;
  validationResult?: ValidationResult;
  uploadProgress: number;
}

const EnhancedUpload: React.FC = () => {
  const [state, setState] = useState<UploadState>({
    files: [],
    uploadType: UploadType.COMBINED,
    isUploading: false,
    uploadProgress: 0
  });

  // 验证ZIP文件
  const validateZipFile = async (file: File): Promise<ValidationResult> => {
    const result: ValidationResult = {
      isValid: false,
      warnings: [],
      errors: [],
      fileCount: 0,
      sourcemapCount: 0,
      sourceCodeCount: 0
    };

    try {
      // 检查文件类型
      if (!file.name.endsWith('.zip')) {
        result.errors.push('文件格式必须是ZIP格式');
        return result;
      }

      // 模拟验证过程 - 实际项目中应该调用后端API
      // 这里模拟验证逻辑
      const hasBuildInfo = file.name.includes('build-info.json');
      
      if (hasBuildInfo) {
        // 模拟构建信息
        result.buildInfo = {
          projectId: 'demo-project',
          version: '1.0.0',
          buildId: Date.now().toString(),
          buildTime: new Date().toISOString(),
          buildType: 'taro',
          sourcemapCount: 7,
          files: [
            { path: 'app.js', size: 1024, type: 'source' },
            { path: 'app.js.map', size: 2048, type: 'sourcemap' }
          ]
        };
        
        result.sourcemapCount = result.buildInfo.sourcemapCount;
        result.sourceCodeCount = result.buildInfo.files.filter(f => f.type === 'source').length;
        result.fileCount = result.buildInfo.files.length;
      } else {
        // 普通ZIP文件
        result.fileCount = 10;
        result.sourcemapCount = 3;
        result.sourceCodeCount = 7;
        result.warnings.push('未检测到构建信息文件，请确保包含完整的源代码和sourcemap文件');
      }

      // 基本验证规则
      if (result.sourcemapCount === 0) {
        result.warnings.push('未检测到sourcemap文件，错误定位功能将无法使用');
      }

      if (result.sourceCodeCount === 0) {
        result.errors.push('未检测到源代码文件');
      }

      result.isValid = result.errors.length === 0;
      
    } catch (error: any) {
      result.errors.push(`文件验证失败: ${error.message}`);
    }

    return result;
  };

  // 处理文件上传
  const handleUpload = useCallback(async (options: any) => {
    const { file, onSuccess, onError, onProgress } = options;
    
    setState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }));

    try {
      // 验证文件
      const validationResult = await validateZipFile(file);
      
      if (!validationResult.isValid) {
        throw new Error('文件验证失败: ' + validationResult.errors.join(', '));
      }

      // 模拟上传进度
      const interval = setInterval(() => {
        setState(prev => {
          const newProgress = Math.min(prev.uploadProgress + 10, 100);
          onProgress({ percent: newProgress });
          return { ...prev, uploadProgress: newProgress };
        });
      }, 200);

      // 模拟上传完成
      setTimeout(() => {
        clearInterval(interval);
        setState(prev => ({
          ...prev,
          isUploading: false,
          uploadProgress: 100,
          validationResult
        }));
        
        onSuccess({}, file);
        message.success('上传成功！');
        
        // 显示验证结果
        if (validationResult.warnings.length > 0) {
          message.warning(validationResult.warnings.join('；'));
        }
        
      }, 2000);

    } catch (error: any) {
      setState(prev => ({ ...prev, isUploading: false }));
      onError(error);
      message.error(error.message);
    }
  }, []);

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.zip',
    showUploadList: false,
    customRequest: handleUpload,
    onChange: (info) => {
      if (info.file.status !== 'uploading') {
        setState(prev => ({ ...prev, files: info.fileList }));
      }
    },
  };

  // 渲染验证结果
  const renderValidationResult = () => {
    if (!state.validationResult) return null;

    const { isValid, warnings, errors, buildInfo, fileCount, sourcemapCount, sourceCodeCount } = state.validationResult;

    return (
      <Card title="验证结果" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="总文件数" value={fileCount} />
            </Col>
            <Col span={8}>
              <Statistic title="源代码文件" value={sourceCodeCount} />
            </Col>
            <Col span={8}>
              <Statistic title="Sourcemap文件" value={sourcemapCount} />
            </Col>
          </Row>

          {buildInfo && (
            <>
              <Divider />
              <Title level={5}>构建信息</Title>
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>项目ID: </Text>
                  <Tag>{buildInfo.projectId}</Tag>
                </Col>
                <Col span={8}>
                  <Text strong>版本: </Text>
                  <Tag>{buildInfo.version}</Tag>
                </Col>
                <Col span={8}>
                  <Text strong>构建类型: </Text>
                  <Tag>{buildInfo.buildType}</Tag>
                </Col>
              </Row>
            </>
          )}

          {errors.length > 0 && (
            <Alert
              message="验证错误"
              description={
                <List
                  size="small"
                  dataSource={errors}
                  renderItem={error => <List.Item>{error}</List.Item>}
                />
              }
              type="error"
              showIcon
            />
          )}

          {warnings.length > 0 && (
            <Alert
              message="验证警告"
              description={
                <List
                  size="small"
                  dataSource={warnings}
                  renderItem={warning => <List.Item>{warning}</List.Item>}
                />
              }
              type="warning"
              showIcon
            />
          )}

          {isValid && errors.length === 0 && (
            <Alert
              message="验证通过"
              description="文件格式正确，可以开始上传"
              type="success"
              showIcon
            />
          )}
        </Space>
      </Card>
    );
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card title={
        <Space>
          <CloudUploadOutlined />
          <span>增强源代码上传</span>
        </Space>
      }>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            支持上传包含源代码和sourcemap的ZIP包，系统会自动验证文件格式并分离存储。
          </Paragraph>
          
          <Upload.Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <FileZipOutlined />
            </p>
            <p className="ant-upload-text">
              点击或拖拽ZIP文件到此处上传
            </p>
            <p className="ant-upload-hint">
              支持包含构建信息的ZIP包或普通ZIP文件
            </p>
          </Upload.Dragger>

          {state.isUploading && (
            <Progress
              percent={state.uploadProgress}
              status="active"
              style={{ marginTop: 16 }}
            />
          )}

          {state.files.length > 0 && !state.isUploading && (
            <Alert
              message={`已选择文件: ${state.files[0].name}`}
              type="info"
              showIcon
            />
          )}
        </Space>
      </Card>

      {renderValidationResult()}

      <Card title="上传指南" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={5}>推荐的上传方式</Title>
          
          <Text strong>1. 使用构建工具（推荐）</Text>
          <Text code>npx monitor-build build --project-id your-project --version 1.0.0</Text>
          
          <Text strong>2. 手动打包上传</Text>
          <Text type="secondary">确保ZIP包包含：</Text>
          <List
            size="small"
            dataSource={[
              '完整的源代码文件',
              '对应的sourcemap文件',
              '（可选）build-info.json构建信息文件'
            ]}
            renderItem={item => <List.Item>{item}</List.Item>}
          />

          <Alert
            message="最佳实践"
            description={
              <div>
                <p>• 在构建流程中自动生成sourcemap</p>
                <p>• 使用提供的构建脚本确保文件完整性</p>
                <p>• 每次发布新版本时上传对应的源代码</p>
              </div>
            }
            type="info"
          />
        </Space>
      </Card>
    </div>
  );
};

export default EnhancedUpload;