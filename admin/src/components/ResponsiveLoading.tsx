import React from 'react';
import { Spin, Typography, Space } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ResponsiveLoadingProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  indicator?: React.ReactElement;
  wrapperClassName?: string;
}

/**
 * 响应式加载组件
 * 提供统一的加载状态展示，支持不同尺寸和自定义样式
 * @param props - 组件属性
 * @returns 响应式加载组件
 */
const ResponsiveLoading: React.FC<ResponsiveLoadingProps> = ({
  size = 'default',
  tip = '加载中...',
  spinning = true,
  children,
  delay = 0,
  className = '',
  style = {},
  indicator,
  wrapperClassName = ''
}) => {
  /**
   * 获取加载指示器
   */
  const getIndicator = () => {
    if (indicator) {
      return indicator;
    }

    const iconSize = {
      small: 16,
      default: 24,
      large: 32
    }[size];

    return (
      <LoadingOutlined 
        style={{ 
          fontSize: iconSize,
          color: '#1890ff'
        }} 
        spin 
      />
    );
  };

  /**
   * 获取容器样式
   */
  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: children ? 'auto' : '200px',
      padding: '20px',
      ...style
    };

    // 响应式调整
    if (window.innerWidth <= 768) {
      baseStyle.padding = '16px';
      baseStyle.minHeight = children ? 'auto' : '150px';
    }

    return baseStyle;
  };

  /**
   * 获取文本样式
   */
  const getTextStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      marginTop: '12px',
      color: '#666',
      fontSize: {
        small: '12px',
        default: '14px',
        large: '16px'
      }[size]
    };

    // 响应式调整
    if (window.innerWidth <= 768) {
      baseStyle.fontSize = {
        small: '11px',
        default: '12px',
        large: '14px'
      }[size];
    }

    return baseStyle;
  };

  // 如果有子组件，使用 Spin 包装
  if (children) {
    return (
      <Spin
        spinning={spinning}
        tip={tip}
        size={size}
        delay={delay}
        indicator={getIndicator()}
        className={`responsive-loading ${className}`}
        wrapperClassName={wrapperClassName}
      >
        {children}
      </Spin>
    );
  }

  // 独立的加载组件
  return (
    <div 
      className={`responsive-loading ${className}`}
      style={getContainerStyle()}
    >
      <Space direction="vertical" align="center" size="middle">
        {getIndicator()}
        {tip && (
          <Text style={getTextStyle()}>
            {tip}
          </Text>
        )}
      </Space>
    </div>
  );
};

/**
 * 页面级加载组件
 */
export const PageLoading: React.FC<{
  tip?: string;
  className?: string;
}> = ({ tip = '页面加载中...', className = '' }) => {
  return (
    <div 
      className={`page-loading ${className}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        zIndex: 9999
      }}
    >
      <ResponsiveLoading size="large" tip={tip} />
    </div>
  );
};

/**
 * 卡片加载组件
 */
export const CardLoading: React.FC<{
  tip?: string;
  height?: number | string;
  className?: string;
}> = ({ tip = '加载中...', height = 200, className = '' }) => {
  return (
    <div 
      className={`card-loading responsive-card ${className}`}
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #f0f0f0'
      }}
    >
      <ResponsiveLoading tip={tip} />
    </div>
  );
};

/**
 * 表格加载组件
 */
export const TableLoading: React.FC<{
  tip?: string;
  rows?: number;
  className?: string;
}> = ({ tip = '数据加载中...', rows = 5, className = '' }) => {
  return (
    <div className={`table-loading ${className}`}>
      <div style={{ marginBottom: '16px' }}>
        <ResponsiveLoading size="small" tip={tip} />
      </div>
      
      {/* 骨架屏效果 */}
      <div style={{ opacity: 0.3 }}>
        {Array.from({ length: rows }, (_, index) => (
          <div 
            key={index}
            style={{
              height: '48px',
              backgroundColor: '#f5f5f5',
              marginBottom: '8px',
              borderRadius: '4px',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 图表加载组件
 */
export const ChartLoading: React.FC<{
  tip?: string;
  height?: number | string;
  className?: string;
}> = ({ tip = '图表加载中...', height = 400, className = '' }) => {
  return (
    <div 
      className={`chart-loading responsive-chart-container ${className}`}
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid #f0f0f0'
      }}
    >
      <Space direction="vertical" align="center" size="large">
        <ResponsiveLoading size="large" tip={tip} />
        
        {/* 图表骨架 */}
        <div style={{ opacity: 0.2 }}>
          <div 
            style={{
              width: '300px',
              height: '200px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* 模拟图表元素 */}
            <div 
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                height: '120px',
                background: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      </Space>
    </div>
  );
};

/**
 * 按钮加载组件
 */
export const ButtonLoading: React.FC<{
  loading?: boolean;
  children: React.ReactNode;
  size?: 'small' | 'middle' | 'large';
  className?: string;
  [key: string]: any;
}> = ({ loading = false, children, size = 'middle', className = '', ...props }) => {
  const iconSize = {
    small: 12,
    middle: 14,
    large: 16
  }[size];

  return (
    <span className={`button-loading ${className}`} {...props}>
      {loading && (
        <LoadingOutlined 
          style={{ 
            fontSize: iconSize,
            marginRight: '8px'
          }} 
          spin 
        />
      )}
      {children}
    </span>
  );
};

export default ResponsiveLoading;