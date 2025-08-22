import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Button,
  Space,
  Drawer,
  Typography,
  Divider,
  Spin,
  Result,
  Steps,
  Progress,
  Alert,
  Tooltip,
  Badge,
  Tag
} from 'antd';
import {
  CloseOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  MinusOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import type { ModalProps, DrawerProps } from 'antd';

const { Title, Text } = Typography;
const { Step } = Steps;

/**
 * 响应式模态框组件属性接口
 * 支持多种显示模式、状态管理和交互功能
 */
interface ResponsiveModalProps extends Omit<ModalProps, 'footer'> {
  // 基础属性
  mode?: 'modal' | 'drawer' | 'fullscreen' | 'auto';
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  type?: 'default' | 'info' | 'success' | 'warning' | 'error' | 'confirm';
  status?: 'idle' | 'loading' | 'success' | 'error';
  
  // 内容配置
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  
  // 步骤配置
  steps?: Array<{
    title: string;
    description?: string;
    status?: 'wait' | 'process' | 'finish' | 'error';
    icon?: React.ReactNode;
  }>;
  currentStep?: number;
  
  // 进度配置
  progress?: {
    percent: number;
    status?: 'success' | 'exception' | 'active' | 'normal';
    showInfo?: boolean;
    strokeColor?: string;
  };
  
  // 页脚配置
  footer?: React.ReactNode | null;
  showFooter?: boolean;
  footerActions?: Array<{
    key: string;
    label: string;
    type?: 'primary' | 'default' | 'dashed' | 'text' | 'link';
    danger?: boolean;
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
  }>;
  
  // 功能开关
  showClose?: boolean;
  showFullscreen?: boolean;
  showMinimize?: boolean;
  showHelp?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  
  // 响应式配置
  breakpoint?: number;
  mobileAsDrawer?: boolean;
  
  // 事件回调
  onFullscreen?: (fullscreen: boolean) => void;
  onMinimize?: () => void;
  onHelp?: () => void;
  onStepChange?: (step: number) => void;
}

/**
 * 响应式模态框组件
 * 提供多种显示模式和丰富的交互功能
 */
const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  mode = 'auto',
  size = 'medium',
  type = 'default',
  status = 'idle',
  title,
  subtitle,
  description,
  icon,
  steps,
  currentStep = 0,
  progress,
  footer,
  showFooter = true,
  footerActions,
  showClose = true,
  showFullscreen = false,
  showMinimize = false,
  showHelp = false,
  draggable = false,
  resizable = false,
  breakpoint = 768,
  mobileAsDrawer = true,
  children,
  onFullscreen,
  onMinimize,
  onHelp,
  onStepChange,
  ...props
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // 响应式检测
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  // 获取显示模式
  const getDisplayMode = () => {
    if (mode === 'auto') {
      if (isMobile && mobileAsDrawer) return 'drawer';
      if (isFullscreen) return 'fullscreen';
      return 'modal';
    }
    return mode;
  };

  // 获取尺寸配置
  const getSizeConfig = () => {
    const displayMode = getDisplayMode();
    
    if (displayMode === 'fullscreen') {
      return {
        width: '100vw',
        height: '100vh',
        fullscreenStyle: {
          top: 0,
          left: 0,
          margin: 0,
          maxWidth: 'none',
          maxHeight: 'none'
        }
      };
    }

    const sizeMap = {
      small: { width: 400, minHeight: 200 },
      medium: { width: 600, minHeight: 300 },
      large: { width: 800, minHeight: 400 },
      'extra-large': { width: 1000, minHeight: 500 }
    };

    return sizeMap[size];
  };

  // 获取类型图标
  const getTypeIcon = () => {
    if (icon) return icon;
    
    const iconMap = {
      info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      warning: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      error: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      confirm: <QuestionCircleOutlined style={{ color: '#faad14' }} />
    };

    return type !== 'default' ? iconMap[type] : null;
  };

  // 获取状态配置
  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          spinning: true,
          indicator: <LoadingOutlined style={{ fontSize: 24 }} spin />
        };
      case 'success':
        return {
          result: (
            <Result
              status="success"
              title="操作成功"
              subTitle="您的操作已成功完成"
            />
          )
        };
      case 'error':
        return {
          result: (
            <Result
              status="error"
              title="操作失败"
              subTitle="操作过程中出现错误，请重试"
            />
          )
        };
      default:
        return {};
    }
  };

  // 处理全屏切换
  const handleFullscreen = () => {
    const newFullscreen = !isFullscreen;
    setIsFullscreen(newFullscreen);
    onFullscreen?.(newFullscreen);
  };

  // 处理最小化
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    onMinimize?.();
  };

  // 处理帮助
  const handleHelp = () => {
    onHelp?.();
  };

  // 处理步骤变更
  const handleStepChange = (step: number) => {
    onStepChange?.(step);
  };

  // 渲染标题栏
  const renderTitleBar = () => {
    const typeIcon = getTypeIcon();
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {typeIcon}
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {title}
            </Title>
            {subtitle && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {subtitle}
              </Text>
            )}
          </div>
        </div>
        
        <Space>
          {showHelp && (
            <Tooltip title="帮助">
              <Button
                type="text"
                size="small"
                icon={<QuestionCircleOutlined />}
                onClick={handleHelp}
              />
            </Tooltip>
          )}
          {showMinimize && (
            <Tooltip title="最小化">
              <Button
                type="text"
                size="small"
                icon={<MinusOutlined />}
                onClick={handleMinimize}
              />
            </Tooltip>
          )}
          {showFullscreen && (
            <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
              <Button
                type="text"
                size="small"
                icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                onClick={handleFullscreen}
              />
            </Tooltip>
          )}
          {showClose && (
            <Tooltip title="关闭">
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={props.onCancel}
              />
            </Tooltip>
          )}
        </Space>
      </div>
    );
  };

  // 渲染内容区域
  const renderContent = () => {
    const statusConfig = getStatusConfig();
    
    if (statusConfig.result) {
      return statusConfig.result;
    }

    return (
      <Spin spinning={statusConfig.spinning} indicator={statusConfig.indicator}>
        <div>
          {description && (
            <>
              <Alert
                message={description}
                type={type === 'default' || type === 'confirm' ? 'info' : type as 'info' | 'success' | 'warning' | 'error'}
                showIcon
                style={{ marginBottom: 16 }}
              />
            </>
          )}
          
          {steps && steps.length > 0 && (
            <>
              <Steps
                current={currentStep}
                onChange={handleStepChange}
                style={{ marginBottom: 24 }}
              >
                {steps.map((step, index) => (
                  <Step
                    key={index}
                    title={step.title}
                    description={step.description}
                    status={step.status}
                    icon={step.icon}
                  />
                ))}
              </Steps>
              <Divider />
            </>
          )}
          
          {progress && (
            <>
              <Progress
                percent={progress.percent}
                status={progress.status}
                showInfo={progress.showInfo}
                strokeColor={progress.strokeColor}
                style={{ marginBottom: 16 }}
              />
            </>
          )}
          
          {children}
        </div>
      </Spin>
    );
  };

  // 渲染页脚
  const renderFooter = () => {
    if (footer === null || !showFooter) return null;
    if (footer) return footer;
    
    if (footerActions && footerActions.length > 0) {
      return (
        <Space>
          {footerActions.map((action) => (
            <Button
              key={action.key}
              type={action.type}
              danger={action.danger}
              loading={action.loading}
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </Space>
      );
    }

    return (
      <Space>
        <Button onClick={props.onCancel}>取消</Button>
        <Button type="primary" onClick={props.onOk}>
          确定
        </Button>
      </Space>
    );
  };

  const displayMode = getDisplayMode();
  const sizeConfig = getSizeConfig();

  // 抽屉模式
  if (displayMode === 'drawer') {
    const drawerProps: DrawerProps = {
      ...props,
      width: sizeConfig.width,
      title: renderTitleBar(),
      footer: renderFooter(),
      closable: false
    };

    return (
      <Drawer {...drawerProps}>
        {renderContent()}
      </Drawer>
    );
  }

  // 模态框模式
  const modalProps = {
    ...props,
    width: sizeConfig.width,
    title: renderTitleBar(),
    footer: renderFooter(),
    closable: false,
    className: `responsive-modal ${displayMode} ${props.className || ''}`.trim(),
    style: {
      ...(sizeConfig as any).fullscreenStyle,
      ...props.style
    }
  };

  if (isMinimized) {
    modalProps.style = {
      ...modalProps.style,
      height: 60,
      overflow: 'hidden'
    };
  }

  return (
    <Modal {...modalProps}>
      {!isMinimized && renderContent()}
    </Modal>
  );
};

// 导出便捷方法
export const showModal = (config: ResponsiveModalProps) => {
  return Modal.confirm({
    title: config.title,
    content: config.children,
    onOk: config.onOk,
    onCancel: config.onCancel
  });
};

export const showInfo = (config: Omit<ResponsiveModalProps, 'type'>) => {
  return showModal({ ...config, type: 'info' });
};

export const showSuccess = (config: Omit<ResponsiveModalProps, 'type'>) => {
  return showModal({ ...config, type: 'success' });
};

export const showWarning = (config: Omit<ResponsiveModalProps, 'type'>) => {
  return showModal({ ...config, type: 'warning' });
};

export const showError = (config: Omit<ResponsiveModalProps, 'type'>) => {
  return showModal({ ...config, type: 'error' });
};

export const showConfirm = (config: Omit<ResponsiveModalProps, 'type'>) => {
  return showModal({ ...config, type: 'confirm' });
};

export default ResponsiveModal;