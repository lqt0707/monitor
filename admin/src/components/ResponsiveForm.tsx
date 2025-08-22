import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Form,
  Card,
  Button,
  Space,
  Row,
  Col,
  Divider,
  Typography,
  Steps,
  Affix,
  BackTop,
  message,
  Modal
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  CheckOutlined,
  CloseOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import type { FormInstance, FormProps } from 'antd/es/form';
import type { SizeType } from 'antd/es/config-provider/SizeContext';

const { Title, Text } = Typography;
const { Step } = Steps;

interface FormSection {
  key: string;
  title: string;
  description?: string;
  fields: React.ReactNode[];
  span?: number;
  required?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

interface FormStep {
  key: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  sections: FormSection[];
  validation?: () => Promise<boolean>;
}

interface ResponsiveFormProps extends Omit<FormProps, 'onFinish' | 'autoSave'> {
  title?: string;
  description?: string;
  sections?: FormSection[];
  steps?: FormStep[];
  loading?: boolean;
  size?: SizeType;
  layout?: 'horizontal' | 'vertical' | 'inline';
  labelCol?: any;
  wrapperCol?: any;
  showHeader?: boolean;
  showFooter?: boolean;
  showPreview?: boolean;
  showReset?: boolean;
  showFullscreen?: boolean;
  showSteps?: boolean;
  stickyFooter?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  validateOnChange?: boolean;
  submitText?: string;
  resetText?: string;
  previewText?: string;
  onSubmit?: (values: any) => Promise<void> | void;
  onReset?: () => void;
  onPreview?: (values: any) => void;
  onAutoSave?: (values: any) => void;
  onStepChange?: (current: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

interface ResponsiveFormRef {
  form: FormInstance;
  submit: () => void;
  reset: () => void;
  validate: () => Promise<boolean>;
  getValues: () => any;
  setValues: (values: any) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

/**
 * 响应式表单组件
 * 提供完整的表单功能，包括分步表单、自动保存、预览等
 * @param props - 组件属性
 * @param ref - 组件引用
 * @returns 响应式表单组件
 */
const ResponsiveForm = forwardRef<ResponsiveFormRef, ResponsiveFormProps>((
  {
    title,
    description,
    sections = [],
    steps = [],
    loading = false,
    size = 'middle',
    layout = 'vertical',
    labelCol,
    wrapperCol,
    showHeader = true,
    showFooter = true,
    showPreview = false,
    showReset = true,
    showFullscreen = true,
    showSteps = false,
    stickyFooter = true,
    autoSave = false,
    autoSaveInterval = 30000,
    validateOnChange = false,
    submitText = '提交',
    resetText = '重置',
    previewText = '预览',
    onSubmit,
    onReset,
    onPreview,
    onAutoSave,
    onStepChange,
    className = '',
    style = {},
    ...formProps
  },
  ref
) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [formValues, setFormValues] = useState<any>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * 初始化折叠状态
   */
  useEffect(() => {
    const initialCollapsed: Record<string, boolean> = {};
    sections.forEach(section => {
      if (section.collapsible) {
        initialCollapsed[section.key] = section.defaultCollapsed || false;
      }
    });
    setCollapsedSections(initialCollapsed);
  }, [sections]);

  /**
   * 自动保存功能
   */
  useEffect(() => {
    if (autoSave && hasUnsavedChanges) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      
      const timer = setTimeout(() => {
        const values = form.getFieldsValue();
        onAutoSave?.(values);
        setHasUnsavedChanges(false);
        message.success('表单已自动保存');
      }, autoSaveInterval);
      
      setAutoSaveTimer(timer);
    }
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSave, hasUnsavedChanges, autoSaveInterval, form, onAutoSave, autoSaveTimer]);

  /**
   * 表单值变化处理
   */
  const handleValuesChange = (changedValues: any, allValues: any) => {
    setFormValues(allValues);
    setHasUnsavedChanges(true);
    
    if (validateOnChange) {
      form.validateFields(Object.keys(changedValues));
    }
    
    formProps.onValuesChange?.(changedValues, allValues);
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit?.(values);
      setHasUnsavedChanges(false);
      message.success('提交成功');
    } catch (error) {
      console.error('表单提交失败:', error);
      message.error('表单验证失败，请检查输入');
    }
  };

  /**
   * 重置表单
   */
  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '重置后将清空所有已填写的内容，确定要继续吗？',
      onOk: () => {
        form.resetFields();
        setFormValues({});
        setHasUnsavedChanges(false);
        onReset?.();
        message.success('表单已重置');
      }
    });
  };

  /**
   * 预览表单
   */
  const handlePreview = () => {
    const values = form.getFieldsValue();
    setIsPreviewMode(!isPreviewMode);
    onPreview?.(values);
  };

  /**
   * 全屏切换
   */
  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  /**
   * 步骤切换
   */
  const handleStepChange = async (step: number) => {
    if (steps.length === 0) return;
    
    // 验证当前步骤
    if (step > currentStep && steps[currentStep]?.validation) {
      const isValid = await steps[currentStep].validation();
      if (!isValid) {
        message.error('请完成当前步骤的必填项');
        return;
      }
    }
    
    setCurrentStep(step);
    onStepChange?.(step);
  };

  /**
   * 下一步
   */
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      handleStepChange(currentStep + 1);
    }
  };

  /**
   * 上一步
   */
  const prevStep = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  };

  /**
   * 切换分组折叠状态
   */
  const toggleSectionCollapse = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  /**
   * 暴露给父组件的方法
   */
  useImperativeHandle(ref, () => ({
    form,
    submit: handleSubmit,
    reset: handleReset,
    validate: async () => {
      try {
        await form.validateFields();
        return true;
      } catch {
        return false;
      }
    },
    getValues: () => form.getFieldsValue(),
    setValues: (values: any) => {
      form.setFieldsValue(values);
      setFormValues(values);
    },
    nextStep,
    prevStep,
    goToStep: (step: number) => handleStepChange(step)
  }));

  /**
   * 渲染表单头部
   */
  const renderHeader = () => {
    if (!showHeader) return null;
    
    return (
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size={0}>
              {title && <Title level={3} style={{ margin: 0 }}>{title}</Title>}
              {description && <Text type="secondary">{description}</Text>}
            </Space>
          </Col>
          <Col>
            <Space>
              {showPreview && (
                <Button
                  icon={isPreviewMode ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  onClick={handlePreview}
                >
                  {isPreviewMode ? '编辑' : previewText}
                </Button>
              )}
              {showFullscreen && (
                <Button
                  type="text"
                  icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  onClick={handleFullscreen}
                />
              )}
            </Space>
          </Col>
        </Row>
        
        {/* 步骤条 */}
        {showSteps && steps.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <Steps
              current={currentStep}
              onChange={handleStepChange}
              size={size === 'large' ? 'default' : size === 'middle' ? 'default' : 'small'}
            >
              {steps.map(step => (
                <Step
                  key={step.key}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                />
              ))}
            </Steps>
          </div>
        )}
      </div>
    );
  };

  /**
   * 渲染表单分组
   */
  const renderSection = (section: FormSection) => {
    const isCollapsed = collapsedSections[section.key];
    
    return (
      <Card
        key={section.key}
        size="small"
        title={
          <Space>
            <span>{section.title}</span>
            {section.required && <Text type="danger">*</Text>}
          </Space>
        }
        extra={
          section.collapsible && (
            <Button
              type="text"
              size="small"
              onClick={() => toggleSectionCollapse(section.key)}
            >
              {isCollapsed ? '展开' : '收起'}
            </Button>
          )
        }
        style={{ marginBottom: '16px' }}
      >
        {section.description && (
          <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
            {section.description}
          </Text>
        )}
        
        {!isCollapsed && (
          <Row gutter={[16, 16]}>
            {section.fields.map((field, index) => (
              <Col
                key={index}
                xs={24}
                sm={section.span ? 24 / section.span : 12}
                md={section.span ? 24 / section.span : 8}
                lg={section.span ? 24 / section.span : 6}
              >
                {field}
              </Col>
            ))}
          </Row>
        )}
      </Card>
    );
  };

  /**
   * 渲染表单内容
   */
  const renderFormContent = () => {
    // 分步表单
    if (showSteps && steps.length > 0) {
      const currentStepData = steps[currentStep];
      if (!currentStepData) return null;
      
      return (
        <div>
          {currentStepData.sections.map(renderSection)}
        </div>
      );
    }
    
    // 普通表单
    return (
      <div>
        {sections.map(renderSection)}
      </div>
    );
  };

  /**
   * 渲染表单底部
   */
  const renderFooter = () => {
    if (!showFooter) return null;
    
    const footerContent = (
      <div style={{ 
        padding: '16px 24px',
        borderTop: '1px solid #f0f0f0',
        backgroundColor: '#fafafa'
      }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              {hasUnsavedChanges && (
                <Text type="warning">有未保存的更改</Text>
              )}
              {autoSave && (
                <Text type="secondary">自动保存已开启</Text>
              )}
            </Space>
          </Col>
          
          <Col>
            <Space>
              {/* 分步表单按钮 */}
              {showSteps && steps.length > 0 && (
                <>
                  <Button
                    icon={<LeftOutlined />}
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    上一步
                  </Button>
                  
                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="primary"
                      icon={<RightOutlined />}
                      onClick={nextStep}
                    >
                      下一步
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={handleSubmit}
                      loading={loading}
                    >
                      {submitText}
                    </Button>
                  )}
                </>
              )}
              
              {/* 普通表单按钮 */}
              {(!showSteps || steps.length === 0) && (
                <>
                  {showReset && (
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={handleReset}
                      disabled={loading}
                    >
                      {resetText}
                    </Button>
                  )}
                  
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSubmit}
                    loading={loading}
                  >
                    {submitText}
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>
      </div>
    );
    
    return stickyFooter ? (
      <Affix offsetBottom={0}>
        {footerContent}
      </Affix>
    ) : footerContent;
  };

  const formElement = (
    <div
      className={`responsive-form ${className}`}
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: '#fff',
        overflow: 'auto',
        ...style
      } : style}
    >
      <Card
        bordered={false}
        style={{
          minHeight: isFullscreen ? '100vh' : 'auto',
          margin: isFullscreen ? 0 : undefined
        }}
        styles={{
          body: { 
            padding: isFullscreen ? '24px' : '16px',
            paddingBottom: showFooter && stickyFooter ? '80px' : '16px'
          }
        }}
      >
        {renderHeader()}
        
        <Form
          {...formProps}
          form={form}
          layout={layout}
          size={size}
          labelCol={labelCol}
          wrapperCol={wrapperCol}
          onValuesChange={handleValuesChange}
          disabled={isPreviewMode}
        >
          {renderFormContent()}
        </Form>
        
        <BackTop visibilityHeight={300} />
      </Card>
      
      {renderFooter()}
    </div>
  );

  return (
    <>
      {formElement}
      
      {/* 样式 */}
      <style>{`
        .responsive-form .ant-card {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        
        .responsive-form .ant-form-item {
          margin-bottom: 16px;
        }
        
        .responsive-form .ant-form-item-label {
          font-weight: 500;
        }
        
        .responsive-form .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
        }
        
        .responsive-form .ant-steps {
          margin: 24px 0;
        }
        
        @media (max-width: 768px) {
          .responsive-form .ant-form-item {
            margin-bottom: 12px;
          }
          
          .responsive-form .ant-card {
            margin: 0;
            border-radius: 0;
          }
          
          .responsive-form .ant-steps {
            margin: 16px 0;
          }
        }
        
        @media (max-width: 576px) {
          .responsive-form .ant-col {
            width: 100% !important;
          }
          
          .responsive-form .ant-form-item-label {
            text-align: left !important;
          }
        }
      `}</style>
    </>
  );
});

ResponsiveForm.displayName = 'ResponsiveForm';

export default ResponsiveForm;
export type { ResponsiveFormProps, ResponsiveFormRef, FormSection, FormStep };