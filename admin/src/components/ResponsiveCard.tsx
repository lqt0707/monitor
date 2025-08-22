import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Dropdown,
  Tooltip,
  Badge,
  Tag,
  Typography,
  Row,
  Col,
  Divider,
  Skeleton,
  Empty,
  Spin,
  Progress,
  Statistic,
  Avatar,
  Image
} from 'antd';
import {
  MoreOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ReloadOutlined,
  SettingOutlined,
  ShareAltOutlined,
  BookOutlined,
  StarOutlined,
  StarFilled,
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import type { CardProps } from 'antd/es/card';
import type { SizeType } from 'antd/es/config-provider/SizeContext';

const { Meta } = Card;
const { Title, Text, Paragraph } = Typography;

interface CardAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  loading?: boolean;
}

interface CardStat {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  precision?: number;
  valueStyle?: React.CSSProperties;
  formatter?: (value: any) => React.ReactNode;
}

interface ResponsiveCardProps extends Omit<CardProps, 'actions' | 'content' | 'size'> {
  // 基础属性
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
  priority?: 'low' | 'medium' | 'high';
  
  // 内容属性
  avatar?: string | React.ReactNode;
  badge?: string | number;
  tags?: string[];
  description?: string;
  content?: React.ReactNode;
  footer?: React.ReactNode;
  
  // 统计数据
  stats?: CardStat[];
  progress?: {
    percent: number;
    status?: 'success' | 'exception' | 'active' | 'normal';
    showInfo?: boolean;
    strokeColor?: string;
  };
  
  // 功能属性
  actions?: CardAction[];
  showFullscreen?: boolean;
  showRefresh?: boolean;
  showSettings?: boolean;
  showBookmark?: boolean;
  showLike?: boolean;
  showShare?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  
  // 状态属性
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
  bookmarked?: boolean;
  liked?: boolean;
  viewCount?: number;
  
  // 事件处理
  onRefresh?: () => void;
  onSettings?: () => void;
  onBookmark?: (bookmarked: boolean) => void;
  onLike?: (liked: boolean) => void;
  onShare?: () => void;
  onFullscreen?: (fullscreen: boolean) => void;
  onCollapse?: (collapsed: boolean) => void;
  
  // 样式属性
  size?: SizeType;
  responsive?: boolean;
  hoverable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 响应式卡片组件
 * 提供丰富的卡片展示功能，包括统计、进度、操作等
 * @param props - 组件属性
 * @returns 响应式卡片组件
 */
const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  status = 'default',
  priority = 'medium',
  avatar,
  badge,
  tags = [],
  description,
  content,
  footer,
  stats = [],
  progress,
  actions = [],
  showFullscreen = false,
  showRefresh = false,
  showSettings = false,
  showBookmark = false,
  showLike = false,
  showShare = false,
  collapsible = false,
  defaultCollapsed = false,
  loading = false,
  empty = false,
  emptyText = '暂无数据',
  bookmarked = false,
  liked = false,
  viewCount,
  onRefresh,
  onSettings,
  onBookmark,
  onLike,
  onShare,
  onFullscreen,
  onCollapse,
  size = 'default',
  responsive = true,
  hoverable = true,
  className = '',
  style = {},
  title,
  extra,
  children,
  ...cardProps
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [isBookmarked, setIsBookmarked] = useState(bookmarked);
  const [isLiked, setIsLiked] = useState(liked);
  const [refreshing, setRefreshing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  /**
   * 获取状态颜色
   */
  const getStatusColor = () => {
    const colors = {
      default: '#d9d9d9',
      success: '#52c41a',
      warning: '#faad14',
      error: '#ff4d4f',
      info: '#1890ff'
    };
    return colors[status];
  };

  /**
   * 获取优先级颜色
   */
  const getPriorityColor = () => {
    const colors = {
      low: '#52c41a',
      medium: '#faad14',
      high: '#ff4d4f'
    };
    return colors[priority];
  };

  /**
   * 获取卡片样式
   */
  const getCardStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      transition: 'all 0.3s ease',
      ...style
    };

    if (isFullscreen) {
      return {
        ...baseStyle,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        margin: 0,
        borderRadius: 0,
        height: '100vh',
        overflow: 'auto'
      };
    }

    return baseStyle;
  };

  /**
   * 处理刷新
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  /**
   * 处理全屏切换
   */
  const handleFullscreen = () => {
    const newFullscreen = !isFullscreen;
    setIsFullscreen(newFullscreen);
    onFullscreen?.(newFullscreen);
  };

  /**
   * 处理折叠切换
   */
  const handleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapse?.(newCollapsed);
  };

  /**
   * 处理收藏切换
   */
  const handleBookmark = () => {
    const newBookmarked = !isBookmarked;
    setIsBookmarked(newBookmarked);
    onBookmark?.(newBookmarked);
  };

  /**
   * 处理点赞切换
   */
  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    onLike?.(newLiked);
  };

  /**
   * 渲染卡片头部
   */
  const renderTitle = () => {
    if (!title) return undefined;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {avatar && (
          typeof avatar === 'string' ? (
            <Avatar src={avatar} size="small" />
          ) : (
            avatar
          )
        )}
        
        <span style={{ flex: 1 }}>{title}</span>
        
        {badge && (
          <Badge 
            count={badge} 
            style={{ backgroundColor: getStatusColor() }}
          />
        )}
        
        {priority !== 'medium' && (
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: getPriorityColor()
            }}
          />
        )}
      </div>
    );
  };

  /**
   * 渲染额外操作
   */
  const renderExtra = () => {
    const extraActions = [];

    if (showLike) {
      extraActions.push(
        <Tooltip key="like" title={isLiked ? '取消点赞' : '点赞'}>
          <Button
            type="text"
            size="small"
            icon={isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
            onClick={handleLike}
          />
        </Tooltip>
      );
    }

    if (showBookmark) {
      extraActions.push(
        <Tooltip key="bookmark" title={isBookmarked ? '取消收藏' : '收藏'}>
          <Button
            type="text"
            size="small"
            icon={isBookmarked ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            onClick={handleBookmark}
          />
        </Tooltip>
      );
    }

    if (showShare) {
      extraActions.push(
        <Tooltip key="share" title="分享">
          <Button
            type="text"
            size="small"
            icon={<ShareAltOutlined />}
            onClick={onShare}
          />
        </Tooltip>
      );
    }

    if (showRefresh) {
      extraActions.push(
        <Tooltip key="refresh" title="刷新">
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={refreshing}
          />
        </Tooltip>
      );
    }

    if (showSettings) {
      extraActions.push(
        <Tooltip key="settings" title="设置">
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            onClick={onSettings}
          />
        </Tooltip>
      );
    }

    if (showFullscreen) {
      extraActions.push(
        <Tooltip key="fullscreen" title={isFullscreen ? '退出全屏' : '全屏'}>
          <Button
            type="text"
            size="small"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={handleFullscreen}
          />
        </Tooltip>
      );
    }

    if (collapsible) {
      extraActions.push(
        <Tooltip key="collapse" title={isCollapsed ? '展开' : '收起'}>
          <Button
            type="text"
            size="small"
            onClick={handleCollapse}
          >
            {isCollapsed ? '展开' : '收起'}
          </Button>
        </Tooltip>
      );
    }

    if (actions.length > 0) {
      const menuItems = actions.map(action => ({
        key: action.key,
        label: action.label,
        icon: action.icon,
        disabled: action.disabled,
        danger: action.danger,
        onClick: action.onClick
      }));

      extraActions.push(
        <Dropdown
          key="more"
          menu={{ items: menuItems }}
          trigger={['click']}
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
          />
        </Dropdown>
      );
    }

    if (extra) {
      extraActions.push(extra);
    }

    return extraActions.length > 0 ? (
      <Space size="small">
        {extraActions}
      </Space>
    ) : undefined;
  };

  /**
   * 渲染统计数据
   */
  const renderStats = () => {
    if (stats.length === 0) return null;

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        {stats.map((stat, index) => (
          <Col key={index} span={24 / Math.min(stats.length, 4)}>
            <Statistic
              title={stat.title}
              value={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              precision={stat.precision}
              valueStyle={stat.valueStyle}
              formatter={stat.formatter}
            />
          </Col>
        ))}
      </Row>
    );
  };

  /**
   * 渲染进度条
   */
  const renderProgress = () => {
    if (!progress) return null;

    return (
      <div style={{ marginBottom: '16px' }}>
        <Progress
          percent={progress.percent}
          status={progress.status}
          showInfo={progress.showInfo}
          strokeColor={progress.strokeColor}
        />
      </div>
    );
  };

  /**
   * 渲染标签
   */
  const renderTags = () => {
    if (tags.length === 0) return null;

    return (
      <div style={{ marginBottom: '12px' }}>
        <Space size={[4, 4]} wrap>
          {tags.map((tag, index) => (
            <Tag key={index}>
              {tag}
            </Tag>
          ))}
        </Space>
      </div>
    );
  };

  /**
   * 渲染描述
   */
  const renderDescription = () => {
    if (!description) return null;

    return (
      <Paragraph
        type="secondary"
        ellipsis={{ rows: 2, expandable: true }}
        style={{ marginBottom: '12px' }}
      >
        {description}
      </Paragraph>
    );
  };

  /**
   * 渲染底部信息
   */
  const renderFooterInfo = () => {
    const footerItems = [];

    if (viewCount !== undefined) {
      footerItems.push(
        <Space key="view" size={4}>
          <EyeOutlined />
          <Text type="secondary">{viewCount}</Text>
        </Space>
      );
    }

    if (footerItems.length === 0 && !footer) return null;

    return (
      <>
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="middle">
            {footerItems}
          </Space>
          {footer}
        </div>
      </>
    );
  };

  /**
   * 渲染卡片内容
   */
  const renderContent = () => {
    if (loading) {
      return (
        <Skeleton
          active
          avatar={!!avatar}
          paragraph={{ rows: 3 }}
        />
      );
    }

    if (empty) {
      return (
        <Empty
          description={emptyText}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    if (isCollapsed) {
      return null;
    }

    return (
      <>
        {renderStats()}
        {renderProgress()}
        {renderTags()}
        {renderDescription()}
        {content || children}
        {renderFooterInfo()}
      </>
    );
  };

  return (
    <>
      <div ref={cardRef}>
        <Card
          {...cardProps}
          title={renderTitle()}
          extra={renderExtra()}
          size={size === 'large' ? 'default' : size === 'middle' ? 'default' : 'small'}
          hoverable={hoverable && !isFullscreen}
          className={`responsive-card ${className}`}
          style={getCardStyle()}
          styles={{
            body: {
              padding: isFullscreen ? '24px' : size === 'small' ? '12px' : '16px'
            }
          }}
        >
          <Spin spinning={refreshing}>
            {renderContent()}
          </Spin>
        </Card>
      </div>

      {/* 样式 */}
      <style>{`
        .responsive-card {
          transition: all 0.3s ease;
        }
        
        .responsive-card:hover {
          transform: translateY(-2px);
        }
        
        .responsive-card .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
        }
        
        .responsive-card .ant-card-head-title {
          padding: 12px 0;
        }
        
        .responsive-card .ant-statistic {
          text-align: center;
        }
        
        .responsive-card .ant-statistic-title {
          font-size: 12px;
          color: #8c8c8c;
        }
        
        .responsive-card .ant-statistic-content {
          font-size: 18px;
          font-weight: 600;
        }
        
        @media (max-width: 768px) {
          .responsive-card {
            margin-bottom: 16px;
          }
          
          .responsive-card .ant-card-head-title {
            padding: 8px 0;
            font-size: 14px;
          }
          
          .responsive-card .ant-statistic-content {
            font-size: 16px;
          }
        }
        
        @media (max-width: 576px) {
          .responsive-card .ant-col {
            width: 50% !important;
          }
          
          .responsive-card .ant-statistic {
            margin-bottom: 12px;
          }
        }
      `}</style>
    </>
  );
};

export default ResponsiveCard;
export type { ResponsiveCardProps, CardAction, CardStat };