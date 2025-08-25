/**
 * 错误日志页面组件
 * 显示详细的错误日志列表和筛选功能
 */

import React, { useState } from "react";
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
  Alert,
  message,
  Form,
} from "antd";
import {
  ReloadOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";

import {
  fetchErrorLogs,
  markErrorResolved,
  reopenError,
} from "../../store/slices/errorSlice";
import type { ErrorLog } from "../../types/monitor";
import {
  getErrorLevelInfo,
  getErrorLevelOptions,
} from "../../utils/errorLevel";
import { useInitialLoad } from "../../hooks/useInitialLoad";
import api from "../../services/api";

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

/**
 * 时间兼容性处理函数
 * 处理不同格式的时间戳字符串
 * @param timestamp 时间戳字符串
 * @returns 格式化的时间字符串
 */
const formatTimestamp = (timestamp: string): string => {
  // 处理空值或undefined
  if (!timestamp) {
    return "未知时间";
  }

  try {
    // 处理ISO格式时间戳
    if (timestamp.includes("T") && timestamp.includes("Z")) {
      return new Date(timestamp).toLocaleString();
    }

    // 处理Unix时间戳（毫秒）
    if (/^\d+$/.test(timestamp)) {
      return new Date(parseInt(timestamp)).toLocaleString();
    }

    // 处理其他格式的时间字符串
    return new Date(timestamp).toLocaleString();
  } catch (error) {
    console.warn("时间格式处理失败:", timestamp, error);
    return timestamp; // 返回原始字符串
  }
};

/**
 * 错误日志页面组件
 * 专门用于显示和管理单个错误日志记录
 * @returns JSX.Element
 */
const ErrorLogs: React.FC = () => {
  const dispatch = useAppDispatch();
  const { errorLogs, errorLogsTotal, errorLogsLoading, error } = useAppSelector(
    (state: any) => state.error
  );

  // 本地状态
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [aiDiagnosisLoading, setAiDiagnosisLoading] = useState(false);
  const [aiDiagnosisResult, setAiDiagnosisResult] = useState<any>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  /**
   * 搜索错误日志数据
   */
  const handleSearch = (values?: any) => {
    const formValues = values || form.getFieldsValue();
    const params: any = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };

    if (formValues.level) params.level = formValues.level;
    if (formValues.status) params.status = formValues.status;
    if (formValues.keyword) params.keyword = formValues.keyword;
    if (formValues.dateRange && formValues.dateRange.length === 2) {
      params.startDate = formValues.dateRange[0].format("YYYY-MM-DD");
      params.endDate = formValues.dateRange[1].format("YYYY-MM-DD");
    }

    dispatch(fetchErrorLogs(params));
  };

  useInitialLoad(() => handleSearch());

  /**
   * 重置搜索条件
   */
  const handleReset = () => {
    form.resetFields();
    handleSearch();
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
   * 触发AI诊断分析
   */
  const handleAiDiagnosis = async () => {
    if (!selectedError) return;

    setAiDiagnosisLoading(true);
    try {
      // 调用重新分析API
      await api.errorAggregations.reanalyze(selectedError.id);
      message.success("AI诊断任务已触发，请稍后刷新查看结果");
    } catch (error) {
      message.error("AI诊断触发失败");
    } finally {
      setAiDiagnosisLoading(false);
    }
  };

  /**
   * 渲染错误级别Tag
   * @param level 错误级别数字
   * @returns 对应的Tag组件
   */
  const renderErrorLevelTag = (level: number) => {
    const levelInfo = getErrorLevelInfo(level);
    return <Tag color={levelInfo.color}>{levelInfo.text}</Tag>;
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
      render: renderErrorLevelTag,
    },
    {
      title: "项目标识",
      dataIndex: "projectId",
      key: "projectId",
      width: 180,
    },
    {
      title: "发生时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (timestamp: string) => formatTimestamp(timestamp),
    },
    {
      title: "用户ID",
      dataIndex: "userId",
      key: "userId",
      width: 120,
    },
    {
      title: "页面URL",
      dataIndex: "pageUrl",
      key: "pageUrl",
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
      width: 120,
      fixed: "right",
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

        {/* 搜索筛选区域 - 表单形式 */}
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          style={{ marginBottom: 16 }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              alignItems: "flex-end",
              width: "100%",
            }}
          >
            <Form.Item
              name="keyword"
              style={{ marginBottom: 0, minWidth: "200px", flex: "1" }}
            >
              <Input placeholder="搜索错误信息" prefix={<SearchOutlined />} />
            </Form.Item>

            <Form.Item
              name="level"
              style={{ marginBottom: 0, minWidth: "150px", flex: "1" }}
            >
              <Select
                placeholder="错误级别"
                style={{ width: "100%" }}
                allowClear
                options={getErrorLevelOptions()}
              />
            </Form.Item>

            <Form.Item
              name="status"
              style={{ marginBottom: 0, minWidth: "150px", flex: "1" }}
            >
              <Select placeholder="状态" style={{ width: "100%" }} allowClear>
                <Option value="open">未解决</Option>
                <Option value="resolved">已解决</Option>
                <Option value="ignored">已忽略</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="dateRange"
              style={{ marginBottom: 0, minWidth: "300px", flex: "2" }}
            >
              <RangePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit">
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => handleSearch()}
                >
                  刷新
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>

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
          loading={errorLogsLoading}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{
            total: errorLogsTotal || 0,
            pageSize: pagination.pageSize,
            current: pagination.current,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            hideOnSinglePage: false,
          }}
          onChange={(paginationConfig) => {
            setPagination({
              current: paginationConfig.current || 1,
              pageSize: paginationConfig.pageSize || 20,
            });
            // 分页变化时自动触发搜索
            setTimeout(() => handleSearch(), 0);
          }}
        />
      </Card>

      {/* 错误详情模态框 */}
      <Modal
        title="错误详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button
            key="ai"
            type="primary"
            loading={aiDiagnosisLoading}
            onClick={handleAiDiagnosis}
            icon={<ExclamationCircleOutlined />}
          >
            AI诊断
          </Button>,
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

            {/* 源代码位置信息 */}
            <Paragraph>
              <Text strong>源代码位置：</Text>
              <br />
              {selectedError.sourceFile && `文件: ${selectedError.sourceFile}`}
              {selectedError.sourceLine && ` 行号: ${selectedError.sourceLine}`}
              {selectedError.sourceColumn &&
                ` 列号: ${selectedError.sourceColumn}`}
            </Paragraph>

            <Paragraph>
              <Text strong>堆栈跟踪：</Text>
              <br />
              {selectedError.errorStack ? (
                <pre
                  style={{ background: "#f5f5f5", padding: 8, fontSize: 12 }}
                >
                  {selectedError.errorStack}
                </pre>
              ) : (
                "-"
              )}
            </Paragraph>

            {/* AI诊断结果 */}
            {selectedError.aiDiagnosis && (
              <Paragraph>
                <Text strong>AI诊断结果：</Text>
                <br />
                <Alert
                  message={selectedError.aiDiagnosis}
                  type="info"
                  showIcon
                />
              </Paragraph>
            )}

            {/* AI修复建议 */}
            {selectedError.aiFixSuggestion && (
              <Paragraph>
                <Text strong>AI修复建议：</Text>
                <br />
                <Alert
                  message={selectedError.aiFixSuggestion}
                  type="success"
                  showIcon
                />
              </Paragraph>
            )}

            <Paragraph>
              <Text strong>用户代理：</Text>
              <br />
              {selectedError.userAgent}
            </Paragraph>
            <Paragraph>
              <Text strong>页面URL：</Text>
              <br />
              {selectedError.pageUrl}
            </Paragraph>
            <Paragraph>
              <Text strong>发生时间：</Text>
              <br />
              {formatTimestamp(selectedError.createdAt)}
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
