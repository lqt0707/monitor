/**
 * 错误监控页面组件
 * 显示错误日志列表和详细信息
 */

import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Tag,
  Space,
  Modal,
  Typography,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Spin,
  Alert,
  message,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "../hooks/redux";
import {
  fetchErrorLogs,
  markErrorResolved,
  reopenError,
} from "../store/slices/errorSlice";
import type { ErrorLog } from "../types/monitor";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 错误监控页面组件
 * @returns JSX.Element
 */
const ErrorMonitor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { errorLogs, loading, error } = useAppSelector(
    (state: any) => state.error
  );

  // 本地状态
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [filters, setFilters] = useState({
    level: "",
    status: "",
    dateRange: null as any,
    keyword: "",
  });

  /**
   * 组件挂载时获取数据
   */
  useEffect(() => {
    handleSearch();
  }, []);

  /**
   * 搜索错误日志
   */
  const handleSearch = () => {
    const params: any = {};
    if (filters.level) params.level = filters.level;
    if (filters.status) params.status = filters.status;
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.dateRange && filters.dateRange.length === 2) {
      params.startDate = filters.dateRange[0].format("YYYY-MM-DD");
      params.endDate = filters.dateRange[1].format("YYYY-MM-DD");
    }
    dispatch(fetchErrorLogs(params));
  };

  /**
   * 重置搜索条件
   */
  const handleReset = () => {
    setFilters({
      level: "",
      status: "",
      dateRange: null,
      keyword: "",
    });
    dispatch(fetchErrorLogs({ page: 1, pageSize: 20 }));
  };

  /**
   * 查看错误详情
   * @param record 错误记录
   */
  const handleViewDetail = (record: ErrorLog) => {
    setSelectedError(record);
    setDetailModalVisible(true);
  };

  /**
   * 标记错误为已解决
   * @param record 错误记录
   */
  const handleMarkResolved = (record: ErrorLog) => {
    setSelectedError(record);
    setResolveModalVisible(true);
  };

  /**
   * 确认解决错误
   */
  const handleConfirmResolve = async () => {
    if (!selectedError) return;

    try {
      await dispatch(markErrorResolved(selectedError.id)).unwrap();
      message.success("错误已标记为已解决");
      setResolveModalVisible(false);
      setResolveNote("");
      setSelectedError(null);
      handleSearch();
    } catch (error) {
      message.error("操作失败");
    }
  };

  /**
   * 重新打开错误
   * @param record 错误记录
   */
  const handleReopenError = async (record: ErrorLog) => {
    try {
      await dispatch(reopenError(record.id)).unwrap();
      message.success("错误已重新打开");
      handleSearch();
    } catch (error) {
      message.error("操作失败");
    }
  };

  /**
   * 获取错误级别标签颜色
   * @param level 错误级别
   * @returns 标签颜色
   */
  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "red";
      case "warn":
        return "orange";
      case "info":
        return "blue";
      default:
        return "default";
    }
  };

  /**
   * 获取状态标签颜色
   * @param status 状态
   * @returns 标签颜色
   */
  const getStatusColor = (status: string) => {
    return status === "resolved" ? "green" : "red";
  };

  // 表格列定义
  const columns: ColumnsType<ErrorLog> = [
    {
      title: "错误信息",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      width: 300,
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 280 }}>
          {text}
        </Text>
      ),
    },
    {
      title: "级别",
      dataIndex: "level",
      key: "level",
      width: 80,
      render: (level: string) => (
        <Tag color={getLevelColor(level)}>{level?.toUpperCase() || "未知"}</Tag>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === "resolved" ? "已解决" : "未解决"}
        </Tag>
      ),
    },
    {
      title: "项目",
      dataIndex: "projectName",
      key: "projectName",
      width: 120,
    },
    {
      title: "用户代理",
      dataIndex: "userAgent",
      key: "userAgent",
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 180 }}>
          {text}
        </Text>
      ),
    },
    {
      title: "发生时间",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record: ErrorLog) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {(record as any).status === "unresolved" ? (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleMarkResolved(record)}
            >
              解决
            </Button>
          ) : (
            <Button
              type="link"
              size="small"
              icon={<ExclamationCircleOutlined />}
              onClick={() => handleReopenError(record)}
            >
              重开
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 页面标题 */}
      <Title level={2} style={{ marginBottom: 24 }}>
        错误监控
      </Title>

      {/* 搜索区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索错误信息"
              value={filters.keyword}
              onChange={(e) =>
                setFilters({ ...filters, keyword: e.target.value })
              }
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择错误级别"
              value={filters.level}
              onChange={(value) => setFilters({ ...filters, level: value })}
              style={{ width: "100%" }}
              allowClear
            >
              <Option value="error">ERROR</Option>
              <Option value="warn">WARN</Option>
              <Option value="info">INFO</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择状态"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: "100%" }}
              allowClear
            >
              <Option value="unresolved">未解决</Option>
              <Option value="resolved">已解决</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              style={{ width: "100%" }}
            />
          </Col>
        </Row>
        <Row style={{ marginTop: 16 }}>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
              <Button icon={<ReloadOutlined />} onClick={handleSearch}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={errorLogs}
          rowKey="id"
          loading={loading}
          pagination={{
            total: errorLogs.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 错误详情模态框 */}
      <Modal
        title="错误详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedError && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text strong>错误信息:</Text>
                <Paragraph copyable>{(selectedError as any).message}</Paragraph>
              </Col>
              <Col span={12}>
                <Text strong>错误级别:</Text>
                <div>
                  <Tag color={getLevelColor((selectedError as any).level)}>
                    {(selectedError as any)?.level?.toUpperCase()}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <Text strong>项目名称:</Text>
                <div>{(selectedError as any).projectName}</div>
              </Col>
              <Col span={12}>
                <Text strong>发生时间:</Text>
                <div>{new Date(selectedError.timestamp).toLocaleString()}</div>
              </Col>
              <Col span={24}>
                <Text strong>堆栈信息:</Text>
                <pre
                  style={{
                    background: "#f5f5f5",
                    padding: "12px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    overflow: "auto",
                    maxHeight: "300px",
                  }}
                >
                  {(selectedError as any).stack || "无堆栈信息"}
                </pre>
              </Col>
              <Col span={12}>
                <Text strong>用户代理:</Text>
                <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                  {selectedError.userAgent}
                </Paragraph>
              </Col>
              <Col span={12}>
                <Text strong>页面URL:</Text>
                <Paragraph copyable ellipsis={{ rows: 2, expandable: true }}>
                  {selectedError.url}
                </Paragraph>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* 解决错误模态框 */}
      <Modal
        title="标记为已解决"
        open={resolveModalVisible}
        onOk={handleConfirmResolve}
        onCancel={() => {
          setResolveModalVisible(false);
          setResolveNote("");
        }}
        okText="确认"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>确定要将此错误标记为已解决吗？</Text>
        </div>
        <TextArea
          placeholder="请输入解决说明（可选）"
          value={resolveNote}
          onChange={(e) => setResolveNote(e.target.value)}
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default ErrorMonitor;
