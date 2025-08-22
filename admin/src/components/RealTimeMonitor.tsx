/**
 * 实时错误监控组件
 * 提供实时错误数据监控、告警和通知功能
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Badge,
  List,
  Avatar,
  Typography,
  Tag,
  Button,
  Switch,
  Divider,
  Alert,
  Space,
  Tooltip,
  Progress,
} from 'antd';
import {
  BellOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  BugOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SoundOutlined,
  MutedOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '../hooks/redux';

const { Title, Text } = Typography;

/**
 * 错误级别图标映射
 */
const ERROR_LEVEL_ICONS = {
  error: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
  warn: <WarningOutlined style={{ color: '#faad14' }} />,
  info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
  debug: <BugOutlined style={{ color: '#52c41a' }} />,
};

/**
 * 错误级别颜色映射
 */
const ERROR_LEVEL_COLORS = {
  error: '#ff4d4f',
  warn: '#faad14',
  info: '#1890ff',
  debug: '#52c41a',
};

/**
 * 实时错误数据接口
 */
interface RealTimeError {
  id: string;
  message: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  projectName: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  count: number;
}

/**
 * 实时监控组件
 * @returns JSX.Element
 */
const RealTimeMonitor: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [realtimeErrors, setRealtimeErrors] = useState<RealTimeError[]>([]);
  const [errorRate, setErrorRate] = useState<number[]>([]);
  const [currentErrorRate, setCurrentErrorRate] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chartRef = useRef<any>(null);

  /**
   * 生成模拟实时错误数据
   * @returns 模拟错误对象
   */
  const generateMockError = (): RealTimeError => {
    const levels: Array<'error' | 'warn' | 'info' | 'debug'> = ['error', 'warn', 'info', 'debug'];
    const projects = ['前端项目', '后端API', '移动端', '用户系统'];
    const messages = [
      'TypeError: Cannot read property of undefined',
      'ReferenceError: variable is not defined',
      'Network request timeout',
      'Database connection failed',
      'Authentication token expired',
      'File upload size exceeded',
      'API rate limit exceeded',
      'Memory usage warning',
    ];

    return {
      id: Math.random().toString(36).substr(2, 9),
      message: messages[Math.floor(Math.random() * messages.length)],
      level: levels[Math.floor(Math.random() * levels.length)],
      projectName: projects[Math.floor(Math.random() * projects.length)],
      timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      url: `https://example.com/page${Math.floor(Math.random() * 10)}`,
      count: Math.floor(Math.random() * 5) + 1,
    };
  };

  /**
   * 播放告警声音
   */
  const playAlertSound = () => {
    if (soundEnabled) {
      // 创建音频上下文播放提示音
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  /**
   * 添加新错误到列表
   * @param error 错误对象
   */
  const addNewError = (error: RealTimeError) => {
    setRealtimeErrors(prev => [error, ...prev.slice(0, 19)]); // 保持最新20条
    
    // 如果是严重错误，播放告警声音
    if (error.level === 'error') {
      playAlertSound();
    }
  };

  /**
   * 更新错误率数据
   */
  const updateErrorRate = () => {
    const newRate = Math.floor(Math.random() * 100);
    setCurrentErrorRate(newRate);
    setErrorRate(prev => {
      const newData = [...prev, newRate];
      return newData.slice(-30); // 保持最新30个数据点
    });
  };

  /**
   * 启动实时监控
   */
  const startMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      // 随机生成错误（30%概率）
      if (Math.random() < 0.3) {
        const newError = generateMockError();
        addNewError(newError);
      }
      
      // 更新错误率
      updateErrorRate();
    }, 2000);
  };

  /**
   * 停止实时监控
   */
  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  /**
   * 组件挂载和卸载处理
   */
  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [isMonitoring]);

  /**
   * 生成实时错误率图表配置
   * @returns ECharts 配置对象
   */
  const getErrorRateOption = () => {
    const xAxisData = errorRate.map((_, index) => {
      return dayjs().subtract(errorRate.length - index - 1, 'second').format('HH:mm:ss');
    });

    return {
      title: {
        text: '实时错误率',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 'normal',
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}%',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        show: false,
      },
      yAxis: {
        type: 'value',
        max: 100,
        show: false,
      },
      series: [
        {
          name: '错误率',
          type: 'line',
          data: errorRate,
          smooth: true,
          symbol: 'none',
          lineStyle: {
            color: currentErrorRate > 70 ? '#ff4d4f' : currentErrorRate > 40 ? '#faad14' : '#52c41a',
            width: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                {
                  offset: 0,
                  color: currentErrorRate > 70 ? 'rgba(255, 77, 79, 0.3)' : 
                         currentErrorRate > 40 ? 'rgba(250, 173, 20, 0.3)' : 'rgba(82, 196, 26, 0.3)',
                },
                {
                  offset: 1,
                  color: currentErrorRate > 70 ? 'rgba(255, 77, 79, 0.1)' : 
                         currentErrorRate > 40 ? 'rgba(250, 173, 20, 0.1)' : 'rgba(82, 196, 26, 0.1)',
                },
              ],
            },
          },
        },
      ],
    };
  };

  /**
   * 获取错误率状态
   * @returns 状态对象
   */
  const getErrorRateStatus = () => {
    if (currentErrorRate > 70) {
      return { status: 'exception', color: '#ff4d4f', text: '严重' };
    } else if (currentErrorRate > 40) {
      return { status: 'active', color: '#faad14', text: '警告' };
    } else {
      return { status: 'success', color: '#52c41a', text: '正常' };
    }
  };

  const errorRateStatus = getErrorRateStatus();

  return (
    <div>
      {/* 控制面板 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <div>
                <Badge status={isMonitoring ? 'processing' : 'default'} />
                <Text strong>实时监控状态: </Text>
                <Text type={isMonitoring ? 'success' : 'secondary'}>
                  {isMonitoring ? '运行中' : '已暂停'}
                </Text>
              </div>
              <div>
                <Text strong>当前错误率: </Text>
                <Text style={{ color: errorRateStatus.color, fontSize: '16px', fontWeight: 'bold' }}>
                  {currentErrorRate}%
                </Text>
                <Tag color={errorRateStatus.color} style={{ marginLeft: 8 }}>
                  {errorRateStatus.text}
                </Tag>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Tooltip title={soundEnabled ? '关闭声音' : '开启声音'}>
                <Button
                  type="text"
                  icon={soundEnabled ? <SoundOutlined /> : <MutedOutlined />}
                  onClick={() => setSoundEnabled(!soundEnabled)}
                />
              </Tooltip>
              <Button
                type={isMonitoring ? 'primary' : 'default'}
                icon={isMonitoring ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                {isMonitoring ? '暂停监控' : '开始监控'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 告警提示 */}
      {currentErrorRate > 70 && (
        <Alert
          message="高错误率告警"
          description={`当前错误率为 ${currentErrorRate}%，已超过安全阈值，请及时处理！`}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]}>
        {/* 实时错误率图表 */}
        <Col xs={24} lg={8}>
          <Card title="实时错误率监控" size="small">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Progress
                type="circle"
                percent={currentErrorRate}
                status={errorRateStatus.status as any}
                strokeColor={errorRateStatus.color}
                size={120}
                format={(percent) => `${percent}%`}
              />
            </div>
            <ReactECharts
              ref={chartRef}
              option={getErrorRateOption()}
              style={{ height: '200px' }}
              opts={{ renderer: 'canvas' }}
            />
          </Card>
        </Col>

        {/* 实时错误列表 */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Space>
                <BellOutlined />
                <span>实时错误日志</span>
                <Badge count={realtimeErrors.length} showZero />
              </Space>
            }
            size="small"
          >
            <List
              itemLayout="horizontal"
              dataSource={realtimeErrors}
              style={{ height: '400px', overflowY: 'auto' }}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Text key="count" type="secondary">
                      {item.count}次
                    </Text>,
                    <Text key="time" type="secondary">
                      {dayjs(item.timestamp).format('HH:mm:ss')}
                    </Text>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        icon={ERROR_LEVEL_ICONS[item.level]}
                        style={{ backgroundColor: 'transparent' }}
                      />
                    }
                    title={
                      <Space>
                        <Text ellipsis style={{ maxWidth: 300 }}>
                          {item.message}
                        </Text>
                        <Tag color={ERROR_LEVEL_COLORS[item.level]}>
                          {item.level.toUpperCase()}
                        </Tag>
                      </Space>
                    }
                    description={
                      <Space split={<Divider type="vertical" />}>
                        <Text type="secondary">{item.projectName}</Text>
                        <Text type="secondary" ellipsis style={{ maxWidth: 200 }}>
                          {item.url}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RealTimeMonitor;