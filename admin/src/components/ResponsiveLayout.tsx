import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Grid,
  Row,
  Col,
  Space,
  Divider,
  Affix,
  BackTop,
  Drawer,
  Button,
  Tooltip,
  FloatButton
} from 'antd';
import {
  MenuOutlined,
  UpOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  BugOutlined,
  MessageOutlined
} from '@ant-design/icons';
import type { RowProps, ColProps } from 'antd';

const { Header, Content, Footer, Sider } = Layout;
const { useBreakpoint } = Grid;

/**
 * 响应式栅格配置接口
 */
interface ResponsiveGridConfig {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
}

/**
 * 响应式布局组件属性接口
 */
interface ResponsiveLayoutProps {
  // 基础配置
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  
  // 布局模式
  mode?: 'horizontal' | 'vertical' | 'grid' | 'flex' | 'masonry';
  direction?: 'row' | 'column';
  wrap?: boolean;
  
  // 间距配置
  gutter?: number | [number, number] | ResponsiveGridConfig;
  gap?: number | string;
  
  // 对齐方式
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly';
  align?: 'top' | 'middle' | 'bottom' | 'stretch';
  
  // 响应式配置
  breakpoints?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
  
  // 容器配置
  container?: boolean;
  maxWidth?: number | string;
  minHeight?: number | string;
  
  // 功能组件
  showBackTop?: boolean;
  showFloatButtons?: boolean;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
  sidebarWidth?: number;
  sidebarCollapsible?: boolean;
  
  // 头部和底部
  header?: React.ReactNode;
  footer?: React.ReactNode;
  headerFixed?: boolean;
  footerFixed?: boolean;
  
  // 事件回调
  onBreakpointChange?: (breakpoint: string) => void;
  onSidebarToggle?: (collapsed: boolean) => void;
}

/**
 * 响应式布局项组件属性接口
 */
interface ResponsiveLayoutItemProps extends Omit<ColProps, 'order'> {
  children?: React.ReactNode;
  order?: number | ResponsiveGridConfig;
  flex?: string | number;
  minWidth?: number | string;
  maxWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
}

/**
 * 响应式布局组件
 * 提供多种布局模式和响应式配置
 */
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  style,
  mode = 'grid',
  direction = 'row',
  wrap = true,
  gutter = 16,
  gap = 16,
  justify = 'start',
  align = 'top',
  breakpoints,
  container = false,
  maxWidth,
  minHeight,
  showBackTop = true,
  showFloatButtons = true,
  showSidebar = false,
  sidebarContent,
  sidebarWidth = 250,
  sidebarCollapsible = true,
  header,
  footer,
  headerFixed = false,
  footerFixed = false,
  onBreakpointChange,
  onSidebarToggle
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const screens = useBreakpoint();
  const layoutRef = useRef<HTMLDivElement>(null);

  // 监听断点变化
  useEffect(() => {
    const activeBreakpoints = Object.entries(screens)
      .filter(([, active]) => active)
      .map(([breakpoint]) => breakpoint);
    
    const breakpointOrder = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentBp = breakpointOrder.find(bp => activeBreakpoints.includes(bp)) || 'lg';
    
    if (currentBp !== currentBreakpoint) {
      setCurrentBreakpoint(currentBp);
      onBreakpointChange?.(currentBp);
    }
  }, [screens, currentBreakpoint, onBreakpointChange]);

  // 处理侧边栏切换
  const handleSidebarToggle = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    onSidebarToggle?.(newCollapsed);
  };

  // 获取容器样式
  const getContainerStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      ...style,
      minHeight
    };

    if (container) {
      baseStyle.maxWidth = maxWidth || '1200px';
      baseStyle.margin = '0 auto';
      baseStyle.padding = '0 16px';
    }

    return baseStyle;
  };

  // 渲染网格布局
  const renderGridLayout = () => {
    return (
      <Row
        gutter={gutter}
        justify={justify}
        align={align}
        wrap={wrap}
        className={className}
        style={getContainerStyle()}
      >
        {children}
      </Row>
    );
  };

  // 渲染弹性布局
  const renderFlexLayout = () => {
    const flexStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: direction,
      flexWrap: wrap ? 'wrap' : 'nowrap',
      justifyContent: justify,
      alignItems: align === 'top' ? 'flex-start' : align === 'bottom' ? 'flex-end' : align === 'middle' ? 'center' : 'stretch',
      gap,
      ...getContainerStyle()
    };

    return (
      <div className={className} style={flexStyle}>
        {children}
      </div>
    );
  };

  // 渲染瀑布流布局
  const renderMasonryLayout = () => {
    const masonryStyle: React.CSSProperties = {
      columnCount: screens.xxl ? 4 : screens.xl ? 3 : screens.lg ? 3 : screens.md ? 2 : 1,
      columnGap: gap,
      ...getContainerStyle()
    };

    return (
      <div className={className} style={masonryStyle}>
        {children}
      </div>
    );
  };

  // 渲染浮动按钮
  const renderFloatButtons = () => {
    if (!showFloatButtons) return null;

    return (
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: 24 }}
        icon={<SettingOutlined />}
      >
        <FloatButton
          icon={<QuestionCircleOutlined />}
          tooltip="帮助"
        />
        <FloatButton
          icon={<BugOutlined />}
          tooltip="反馈"
        />
        <FloatButton
          icon={<MessageOutlined />}
          tooltip="联系我们"
        />
      </FloatButton.Group>
    );
  };

  // 渲染内容区域
  const renderContent = () => {
    let content;
    
    switch (mode) {
      case 'flex':
        content = renderFlexLayout();
        break;
      case 'masonry':
        content = renderMasonryLayout();
        break;
      case 'horizontal':
      case 'vertical':
      case 'grid':
      default:
        content = renderGridLayout();
        break;
    }

    return (
      <Content style={{ padding: '24px', minHeight: 'calc(100vh - 64px)' }}>
        {content}
      </Content>
    );
  };

  // 如果有侧边栏，使用 Layout 组件
  if (showSidebar) {
    return (
      <Layout ref={layoutRef} style={{ minHeight: '100vh' }}>
        {header && (
          <Header
            style={{
              position: headerFixed ? 'fixed' : 'static',
              top: 0,
              zIndex: 1000,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px'
            }}
          >
            {sidebarCollapsible && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={handleSidebarToggle}
                style={{ marginRight: 16 }}
              />
            )}
            {header}
          </Header>
        )}
        
        <Layout>
          <Sider
            width={sidebarWidth}
            collapsed={sidebarCollapsed}
            collapsible={sidebarCollapsible}
            onCollapse={handleSidebarToggle}
            style={{
              overflow: 'auto',
              height: '100vh',
              position: 'fixed',
              left: 0,
              top: header && headerFixed ? 64 : 0
            }}
          >
            {sidebarContent}
          </Sider>
          
          <Layout
            style={{
              marginLeft: sidebarCollapsed ? 80 : sidebarWidth,
              marginTop: header && headerFixed ? 64 : 0
            }}
          >
            {renderContent()}
            
            {footer && (
              <Footer
                style={{
                  position: footerFixed ? 'fixed' : 'static',
                  bottom: 0,
                  width: '100%',
                  textAlign: 'center',
                  zIndex: 1000
                }}
              >
                {footer}
              </Footer>
            )}
          </Layout>
        </Layout>
        
        {showBackTop && <BackTop />}
        {renderFloatButtons()}
      </Layout>
    );
  }

  // 简单布局模式
  return (
    <Layout ref={layoutRef} style={{ minHeight: '100vh' }}>
      {header && (
        <Header
          style={{
            position: headerFixed ? 'fixed' : 'static',
            top: 0,
            zIndex: 1000,
            width: '100%'
          }}
        >
          {header}
        </Header>
      )}
      
      {renderContent()}
      
      {footer && (
        <Footer
          style={{
            position: footerFixed ? 'fixed' : 'static',
            bottom: 0,
            width: '100%',
            textAlign: 'center',
            zIndex: 1000
          }}
        >
          {footer}
        </Footer>
      )}
      
      {showBackTop && <BackTop />}
      {renderFloatButtons()}
    </Layout>
  );
};

/**
 * 响应式布局项组件
 * 用于在响应式布局中定义单个项目
 */
const ResponsiveLayoutItem: React.FC<ResponsiveLayoutItemProps> = ({
  children,
  order,
  flex,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  style,
  ...colProps
}) => {
  const itemStyle: React.CSSProperties = {
    ...style,
    flex,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight
  };

  // 处理响应式 order
  if (typeof order === 'object') {
    const screens = useBreakpoint();
    const activeBreakpoints = Object.entries(screens)
      .filter(([, active]) => active)
      .map(([breakpoint]) => breakpoint);
    
    const breakpointOrder = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'];
    const currentBp = breakpointOrder.find(bp => activeBreakpoints.includes(bp)) || 'lg';
    
    if (order[currentBp as keyof ResponsiveGridConfig] !== undefined) {
      itemStyle.order = order[currentBp as keyof ResponsiveGridConfig];
    }
  } else if (typeof order === 'number') {
    itemStyle.order = order;
  }

  return (
    <Col {...colProps} style={itemStyle}>
      {children}
    </Col>
  );
};

// 导出便捷组件
export const Container: React.FC<{
  children?: React.ReactNode;
  maxWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, maxWidth = '1200px', className, style }) => {
  return (
    <div
      className={className}
      style={{
        maxWidth,
        margin: '0 auto',
        padding: '0 16px',
        ...style
      }}
    >
      {children}
    </div>
  );
};

export const Section: React.FC<{
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: number | string;
}> = ({ children, className, style, padding = '24px 0' }) => {
  return (
    <section
      className={className}
      style={{
        padding,
        ...style
      }}
    >
      {children}
    </section>
  );
};

export { ResponsiveLayoutItem };
export default ResponsiveLayout;