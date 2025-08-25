import React, { useState } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Typography,
  Tooltip,
  Badge,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  BugOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";
import {
  fetchErrorAggregations,
  markErrorResolved,
  reopenError,
} from "../../store/slices/errorSlice";
import type { ErrorAggregation } from "../../types/monitor";
import {
  getErrorLevelInfo,
  getErrorLevelOptions,
} from "../../utils/errorLevel";
import dayjs from "dayjs";
import { useInitialLoad } from "../../hooks/useInitialLoad";
import type { ColumnsType } from "antd/es/table";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text, Paragraph } = Typography;
const { TextArea } = Input;

/**
 * 错误聚合页面组件
 * 用于显示和管理错误聚合数据，包括错误统计、AI诊断建议等
 */
const ErrorAggregations: React.FC = () => {
  const dispatch = useDispatch();
  const {
    errorAggregations,
    errorAggregationsLoading,
    errorAggregationsTotal,
  } = useSelector((state: RootState) => state.error);
  const { projects } = useSelector((state: RootState) => state.project);

  // 状态管理
  const [selectedAggregation, setSelectedAggregation] =
    useState<ErrorAggregation | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [filters, setFilters] = useState({
    projectId: "",
    errorLevel: "",
    dateRange: null as any,
    keyword: "",
    isResolved: "",
  });

  /**
   * 搜索错误聚合数据
   */
  const handleSearch = () => {
    const params: any = {
      page: 1,
      pageSize: 10,
      projectId: filters.projectId || undefined,
      startDate: filters.dateRange?.[0]?.format("YYYY-MM-DD"),
      endDate: filters.dateRange?.[1]?.format("YYYY-MM-DD"),
      isResolved: filters.isResolved
        ? filters.isResolved === "true"
        : undefined,
    };

    // 只有当errorLevel有值且大于等于1时才包含
    if (filters.errorLevel && parseInt(filters.errorLevel) >= 1) {
      params.errorLevel = parseInt(filters.errorLevel);
    }

    // 只有当keyword有值时才包含
    if (filters.keyword && filters.keyword.trim() !== "") {
      params.keyword = filters.keyword.trim();
    }

    dispatch(fetchErrorAggregations(params) as any);
  };

  /**
   * 组件挂载时获取数据
   * 使用useInitialLoad hook防止StrictMode下的重复请求
   */
  useInitialLoad(handleSearch);

  /**
   * 重置搜索条件
   */
  const handleReset = () => {
    setFilters({
      projectId: "",
      errorLevel: "",
      dateRange: null,
      keyword: "",
      isResolved: "",
    });
  };

  /**
   * 查看错误详情
   */
  const handleViewDetail = (record: ErrorAggregation) => {
    setSelectedAggregation(record);
    setDetailModalVisible(true);
  };

  /**
   * 标记为已解决
   */
  const handleResolve = (record: ErrorAggregation) => {
    setSelectedAggregation(record);
    setResolveModalVisible(true);
  };

  /**
   * 重新打开错误
   */
  const handleReopen = async (record: ErrorAggregation) => {
    try {
      await dispatch(reopenError(record.id) as any);
      handleSearch();
    } catch (error) {
      message.error("操作失败");
    }
  };

  /**
   * 确认解决错误
   */
  const handleConfirmResolve = async () => {
    if (!selectedAggregation) return;

    try {
      await dispatch(markErrorResolved(selectedAggregation.id) as any);
      message.success("错误已标记为已解决");
      setResolveModalVisible(false);
      setResolveNote("");
      handleSearch();
    } catch (error) {
      message.error("操作失败");
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

  // 表格列定义
  const columns: ColumnsType<ErrorAggregation> = [
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
      title: "出现次数",
      dataIndex: "occurrenceCount",
      key: "occurrenceCount",
      width: 100,
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: "#52c41a" }} />
      ),
    },
    {
      title: "首次出现",
      dataIndex: "firstOccurrence",
      key: "firstOccurrence",
      width: 150,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "最后出现",
      dataIndex: "lastOccurrence",
      key: "lastOccurrence",
      width: 150,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
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
      title: "AI诊断",
      dataIndex: "aiDiagnosis",
      key: "aiDiagnosis",
      width: 100,
      render: (aiDiagnosis: string) =>
        aiDiagnosis ? (
          <Tooltip title={aiDiagnosis}>
            <Tag color="blue" icon={<BugOutlined />}>
              有诊断
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="gray">无诊断</Tag>
        ),
    },
    {
      title: "操作",
      key: "action",
      width: 160,
      fixed: "right",
      render: (_: any, record: ErrorAggregation) => (
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
        <Form
          style={{
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "flex-end",
          }}
        >
          <Form.Item label="项目" style={{ marginBottom: 0, minWidth: 200 }}>
            <Select
              style={{ width: "100%" }}
              placeholder="选择项目"
              value={filters.projectId}
              onChange={(value) => setFilters({ ...filters, projectId: value })}
              allowClear
            >
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="错误级别"
            style={{ marginBottom: 0, minWidth: 120 }}
          >
            <Select
              style={{ width: "100%" }}
              placeholder="选择级别"
              value={filters.errorLevel}
              onChange={(value) =>
                setFilters({ ...filters, errorLevel: value })
              }
              allowClear
              options={getErrorLevelOptions()}
            />
          </Form.Item>
          <Form.Item label="状态" style={{ marginBottom: 0, minWidth: 120 }}>
            <Select
              style={{ width: "100%" }}
              placeholder="选择状态"
              value={filters.isResolved}
              onChange={(value) =>
                setFilters({ ...filters, isResolved: value })
              }
              allowClear
            >
              <Option value="false">未解决</Option>
              <Option value="true">已解决</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="时间范围"
            style={{ marginBottom: 0, minWidth: 300 }}
          >
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
          </Form.Item>
          <Form.Item label="关键词" style={{ marginBottom: 0, minWidth: 200 }}>
            <Input
              style={{ width: "100%" }}
              placeholder="搜索错误信息"
              value={filters.keyword}
              onChange={(e) =>
                setFilters({ ...filters, keyword: e.target.value })
              }
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
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
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={errorAggregations}
          loading={errorAggregationsLoading}
          rowKey="id"
          pagination={{
            total: errorAggregationsTotal,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 错误详情模态框 */}
      <Modal
        title="错误聚合详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedAggregation && (
          <div>
            <Paragraph>
              <Text strong>错误信息：</Text>
              <br />
              {selectedAggregation.errorMessage}
            </Paragraph>
            <Paragraph>
              <Text strong>错误级别：</Text>
              {renderErrorLevelTag(selectedAggregation.errorLevel)}
            </Paragraph>
            <Paragraph>
              <Text strong>出现次数：</Text>{" "}
              {selectedAggregation.occurrenceCount}
            </Paragraph>
            <Paragraph>
              <Text strong>首次出现：</Text>{" "}
              {dayjs(selectedAggregation.firstOccurrence).format(
                "YYYY-MM-DD HH:mm:ss"
              )}
            </Paragraph>
            <Paragraph>
              <Text strong>最后出现：</Text>{" "}
              {dayjs(selectedAggregation.lastOccurrence).format(
                "YYYY-MM-DD HH:mm:ss"
              )}
            </Paragraph>
            <Paragraph>
              <Text strong>源文件：</Text>{" "}
              {selectedAggregation.sourceFile || "未知"}
            </Paragraph>
            <Paragraph>
              <Text strong>行号：</Text>{" "}
              {selectedAggregation.sourceLine || "未知"}
            </Paragraph>
            {selectedAggregation.aiDiagnosis && (
              <Paragraph>
                <Text strong>AI诊断：</Text>
                <br />
                <div
                  style={{
                    background: "#f0f8ff",
                    padding: 12,
                    borderRadius: 4,
                    marginTop: 8,
                  }}
                >
                  {selectedAggregation.aiDiagnosis}
                </div>
              </Paragraph>
            )}
            {selectedAggregation.aiFixSuggestion && (
              <Paragraph>
                <Text strong>修复建议：</Text>
                <br />
                <div
                  style={{
                    background: "#f6ffed",
                    padding: 12,
                    borderRadius: 4,
                    marginTop: 8,
                  }}
                >
                  {selectedAggregation.aiFixSuggestion}
                </div>
              </Paragraph>
            )}
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
        <p>确定要将此错误标记为已解决吗？</p>
        <TextArea
          rows={4}
          placeholder="请输入解决说明（可选）"
          value={resolveNote}
          onChange={(e) => setResolveNote(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default ErrorAggregations;
