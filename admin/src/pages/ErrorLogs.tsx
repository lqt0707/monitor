/**
 * 错误日志页面组件
 * 显示详细的错误日志列表和筛选功能
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
 * 错误日志页面组件
 * 专门用于显示和管理单个错误日志记录
 * @returns JSX.Element
 */
const ErrorLogs: React.FC = () => {
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
   * 搜索错误日志数据
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
  const handleResolve = (record: ErrorLog) => {
    setSelectedError(record);
    setResolveModalVisible(true);
  };

  /**
   * 确认解决错误
   */
  const handleConfirmResolve = async () => {
    if (!selectedError) return;

    try {
      await dispatch(markErrorResolved(selectedError.id));
      message.success("错误已标记为已解决");
      setResolveModalVisible(false);
      setResolveNote("");
      handleSearch();
    } catch (error) {
      message.error("操作失败");
    }
  };

  /**
   * 重新打开错误
   * @param record 错误记录
   */
  const handleReopen = async (record: ErrorLog) => {
    try {
      await dispatch(reopenError(record.id));
      message.success("错误已重新打开");
      handleSearch();
    } catch (error) {
      message.error("操作失败");
    }
  };

  /**
   * 表格列配置
   */
  const columns: ColumnsType<ErrorLog> = [
    {
      title: "错误信息",
      dataIndex: "errorMessage",
      key: "errorMessage",
      ellipsis: true,
      width: 300,
    },
    {
      title: "错误级别",
      dataIndex: "errorLevel",
      key: "errorLevel",
      width: 100,
      render: (level: string) => {
        const colors = {
          error: "red",
          warning: "orange",
          info: "blue",
          critical: "purple",
        };
        return (
          <Tag color={colors[level as keyof typeof colors]}>
            {level || "未知"}
          </Tag>
        );
      },
    },
    {
      title: "发生时间",
      dataIndex: "timestamp",
      key: "timestamp",
      width: 180,
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
    },
    {
      title: "用户ID",
      dataIndex: "userId",
      key: "userId",
      width: 120,
    },
    {
      title: "页面URL",
      dataIndex: "url",
      key: "url",
      ellipsis: true,
      width: 200,
    },
    {
      title: "状态",
      dataIndex: "isResolved",
      key: "isResolved",
      width: 100,
      render: (isResolved: boolean) => {
        return (
          <Tag color={isResolved ? "green" : "red"}>
            {isResolved ? "已解决" : "未解决"}
          </Tag>
        );
      },
    },
    {
      title: "操作",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {!record.isResolved && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleResolve(record)}
            >
              解决
            </Button>
          )}
          {record.isResolved && (
            <Button
              type="link"
              size="small"
              icon={<ExclamationCircleOutlined />}
              onClick={() => handleReopen(record)}
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
      <Card>
        <Title level={4}>错误日志</Title>

        {/* 搜索筛选区域 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="搜索错误信息"
              value={filters.keyword}
              onChange={(e) =>
                setFilters({ ...filters, keyword: e.target.value })
              }
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="错误级别"
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
          <Col span={4}>
            <Select
              placeholder="状态"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: "100%" }}
              allowClear
            >
              <Option value="open">未解决</Option>
              <Option value="resolved">已解决</Option>
              <Option value="ignored">已忽略</Option>
            </Select>
          </Col>
          <Col span={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button type="primary" onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
              <Button icon={<ReloadOutlined />} onClick={handleSearch}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

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
        <Table
          columns={columns}
          dataSource={errorLogs}
          loading={loading}
          rowKey="id"
          pagination={{
            total: errorLogs?.length || 0,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
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
            <Paragraph>
              <Text strong>错误信息：</Text>
              <br />
              {selectedError.errorMessage}
            </Paragraph>
            <Paragraph>
              <Text strong>堆栈跟踪：</Text>
              <br />
              <pre style={{ background: "#f5f5f5", padding: 8, fontSize: 12 }}>
                {selectedError.errorStack}
              </pre>
            </Paragraph>
            <Paragraph>
              <Text strong>用户代理：</Text>
              <br />
              {selectedError.userAgent}
            </Paragraph>
            <Paragraph>
              <Text strong>页面URL：</Text>
              <br />
              {selectedError.url}
            </Paragraph>
            <Paragraph>
              <Text strong>发生时间：</Text>
              <br />
              {new Date(selectedError.timestamp).toLocaleString()}
            </Paragraph>
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
      >
        <Paragraph>确定要将此错误标记为已解决吗？</Paragraph>
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

export default ErrorLogs;
