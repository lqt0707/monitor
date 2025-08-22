import React from 'react';
import { Empty, Button, Space, Typography } from 'antd';
import {
  InboxOutlined,
  FileSearchOutlined,
  DatabaseOutlined,
  DisconnectOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ReloadOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface ResponsiveEmptyProps {
  type?: 'default' | 'search' | 'data' | 'network' | 'error' | 'custom';
  title?: string;
  description?: string;
  image?: React.ReactNode;
  imageStyle?: React.CSSProperties;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  size?: 'small' | 'default' | 'large';
  showAction?: boolean;
  actionText?: string;
  onAction?: () => void;
  actionType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  showSecondaryAction?: boolean;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

/**
 * 响应式空状态组件
 * 提供统一的空状态展示，支持不同类型和自定义操作
 * @param props - 组件属性
 * @returns 响应式空状态组件
 */
const ResponsiveEmpty: React.FC<ResponsiveEmptyProps> = ({
  type = 'default',
  title,
  description,
  image,
  imageStyle = {},
  children,
  className = '',
  style = {},
  size = 'default',
  showAction = false,
  actionText,
  onAction,
  actionType = 'primary',
  showSecondaryAction = false,
  secondaryActionText,
  onSecondaryAction
}) => {
  /**
   * 获取预设配置
   */
  const getPresetConfig = () => {
    const configs = {
      default: {
        icon: <InboxOutlined />,
        title: '暂无数据',
        description: '当前没有可显示的内容',
        actionText: '刷新'
      },
      search: {
        icon: <FileSearchOutlined />,
        title: '无搜索结果',
        description: '未找到符合条件的数据，请尝试其他搜索条件',
        actionText: '重新搜索'
      },
      data: {
        icon: <DatabaseOutlined />,
        title: '暂无数据',
        description: '系统中还没有相关数据，请先添加数据',
        actionText: '添加数据'
      },
      network: {
        icon: <DisconnectOutlined />,
        title: '网络连接失败',
        description: '请检查网络连接后重试',
        actionText: '重试'
      },
      error: {
        icon: <ExclamationCircleOutlined />,
        title: '加载失败',
        description: '数据加载出现错误，请稍后重试',
        actionText: '重新加载'
      },
      custom: {
        icon: <InboxOutlined />,
        title: '',
        description: '',
        actionText: '操作'
      }
    };

    return configs[type];
  };

  const presetConfig = getPresetConfig();

  /**
   * 获取图标大小
   */
  const getIconSize = () => {
    const sizes = {
      small: 48,
      default: 64,
      large: 80
    };

    // 响应式调整
    if (window.innerWidth <= 768) {
      return Math.max(sizes[size] - 16, 32);
    }

    return sizes[size];
  };

  /**
   * 获取自定义图像
   */
  const getCustomImage = () => {
    if (image) {
      return image;
    }

    const iconSize = getIconSize();
    const iconColor = '#d9d9d9';

    return (
      <div style={{
        fontSize: iconSize,
        color: iconColor,
        ...imageStyle
      }}>
        {presetConfig.icon}
      </div>
    );
  };

  /**
   * 获取容器样式
   */
  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '40px 20px',
      textAlign: 'center',
      ...style
    };

    // 响应式调整
    if (window.innerWidth <= 768) {
      baseStyle.padding = '30px 16px';
    }

    if (window.innerWidth <= 480) {
      baseStyle.padding = '20px 12px';
    }

    return baseStyle;
  };

  /**
   * 获取标题样式
   */
  const getTitleStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      marginTop: '16px',
      marginBottom: '8px',
      color: '#262626'
    };

    return baseStyle;
  };

  /**
   * 获取描述样式
   */
  const getDescriptionStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      color: '#8c8c8c',
      fontSize: '14px',
      lineHeight: '1.5',
      maxWidth: '400px',
      margin: '0 auto'
    };

    // 响应式调整
    if (window.innerWidth <= 768) {
      baseStyle.fontSize = '13px';
      baseStyle.maxWidth = '300px';
    }

    return baseStyle;
  };

  /**
   * 获取操作按钮大小
   */
  const getButtonSize = () => {
    if (window.innerWidth <= 768) {
      return size === 'large' ? 'middle' : 'small';
    }
    return size === 'small' ? 'small' : 'middle';
  };

  /**
   * 渲染操作按钮
   */
  const renderActions = () => {
    if (!showAction && !showSecondaryAction) {
      return null;
    }

    const buttonSize = getButtonSize();
    const actions = [];

    if (showAction) {
      const finalActionText = actionText || presetConfig.actionText;
      const actionIcon = type === 'data' ? <PlusOutlined /> : <ReloadOutlined />;
      
      actions.push(
        <Button
          key="primary"
          type={actionType}
          size={buttonSize}
          icon={actionIcon}
          onClick={onAction}
        >
          {finalActionText}
        </Button>
      );
    }

    if (showSecondaryAction && secondaryActionText) {
      actions.push(
        <Button
          key="secondary"
          type="default"
          size={buttonSize}
          onClick={onSecondaryAction}
        >
          {secondaryActionText}
        </Button>
      );
    }

    return (
      <Space 
        size="middle" 
        style={{ marginTop: '24px' }}
        direction={window.innerWidth <= 480 ? 'vertical' : 'horizontal'}
      >
        {actions}
      </Space>
    );
  };

  const finalTitle = title || presetConfig.title;
  const finalDescription = description || presetConfig.description;

  return (
    <div 
      className={`responsive-empty responsive-empty-${type} ${className}`}
      style={getContainerStyle()}
    >
      <Empty
        image={getCustomImage()}
        imageStyle={{
          height: getIconSize(),
          marginBottom: '16px',
          ...imageStyle
        }}
        description={null}
      >
        {/* 自定义内容区域 */}
        <div>
          {finalTitle && (
            <Title 
              level={size === 'large' ? 3 : 4} 
              style={getTitleStyle()}
            >
              {finalTitle}
            </Title>
          )}
          
          {finalDescription && (
            <Text style={getDescriptionStyle()}>
              {finalDescription}
            </Text>
          )}
          
          {children}
          
          {renderActions()}
        </div>
      </Empty>
    </div>
  );
};

/**
 * 搜索空状态组件
 */
export const SearchEmpty: React.FC<{
  keyword?: string;
  onReset?: () => void;
  className?: string;
}> = ({ keyword, onReset, className = '' }) => {
  return (
    <ResponsiveEmpty
      type="search"
      description={keyword ? `未找到包含 "${keyword}" 的结果` : '未找到符合条件的数据'}
      showAction={!!onReset}
      actionText="清空筛选"
      actionType="default"
      onAction={onReset}
      className={className}
    />
  );
};

/**
 * 数据空状态组件
 */
export const DataEmpty: React.FC<{
  title?: string;
  description?: string;
  onCreate?: () => void;
  createText?: string;
  className?: string;
}> = ({ 
  title = '暂无数据', 
  description = '还没有任何数据，点击下方按钮开始添加', 
  onCreate, 
  createText = '添加数据',
  className = '' 
}) => {
  return (
    <ResponsiveEmpty
      type="data"
      title={title}
      description={description}
      showAction={!!onCreate}
      actionText={createText}
      onAction={onCreate}
      className={className}
    />
  );
};

/**
 * 网络错误空状态组件
 */
export const NetworkEmpty: React.FC<{
  onRetry?: () => void;
  className?: string;
}> = ({ onRetry, className = '' }) => {
  return (
    <ResponsiveEmpty
      type="network"
      showAction={!!onRetry}
      onAction={onRetry}
      className={className}
    />
  );
};

/**
 * 错误空状态组件
 */
export const ErrorEmpty: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}> = ({ 
  title = '加载失败', 
  description = '数据加载出现错误，请稍后重试', 
  onRetry, 
  retryText = '重新加载',
  className = '' 
}) => {
  return (
    <ResponsiveEmpty
      type="error"
      title={title}
      description={description}
      showAction={!!onRetry}
      actionText={retryText}
      onAction={onRetry}
      className={className}
    />
  );
};

/**
 * 表格空状态组件
 */
export const TableEmpty: React.FC<{
  description?: string;
  onCreate?: () => void;
  createText?: string;
  size?: 'small' | 'default' | 'large';
  className?: string;
}> = ({ 
  description = '表格中暂无数据', 
  onCreate, 
  createText = '添加数据',
  size = 'small',
  className = '' 
}) => {
  return (
    <ResponsiveEmpty
      type="data"
      description={description}
      size={size}
      showAction={!!onCreate}
      actionText={createText}
      onAction={onCreate}
      className={className}
      style={{ padding: '20px' }}
    />
  );
};

export default ResponsiveEmpty;