import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Card,
  Button,
  Space,
  Input,
  Select,
  Tooltip,
  Dropdown,
  Checkbox,
  Tag,
  Typography,
  Row,
  Col,
  Divider,
  Badge,
  Popconfirm,
  message,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SettingOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import "../styles/responsive-components.css";
import type { ColumnsType, TableProps } from "antd/es/table";
import type { SizeType } from "antd/es/config-provider/SizeContext";

const { Search } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

interface ResponsiveTableColumn {
  key: string;
  title: string;
  dataIndex: string;
  width?: number;
  fixed?: "left" | "right";
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  filters?: Array<{ text: string; value: any }>;
  defaultVisible?: boolean;
  responsive?: ("xs" | "sm" | "md" | "lg" | "xl" | "xxl")[];
  ellipsis?: boolean;
  align?: "left" | "center" | "right";
}

interface ResponsiveTableProps {
  columns: ResponsiveTableColumn[];
  dataSource: any[];
  loading?: boolean;
  title?: string;
  showHeader?: boolean;
  showSearch?: boolean;
  showFilter?: boolean;
  showColumnSettings?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  showFullscreen?: boolean;
  showRowSelection?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  size?: SizeType;
  bordered?: boolean;
  striped?: boolean;
  onSearch?: (value: string) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onExport?: (data: any[]) => void;
  onRefresh?: () => void;
  onRowSelect?: (selectedRows: any[]) => void;
  onAdd?: () => void;
  onEdit?: (record: any) => void;
  onDelete?: (record: any) => void;
  rowKey?: string | ((record: any) => string);
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 响应式表格组件
 * 提供完整的数据表格功能，包括搜索、过滤、排序、导出等
 * @param props - 组件属性
 * @returns 响应式表格组件
 */
const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  dataSource,
  loading = false,
  title,
  showHeader = true,
  showSearch = true,
  showFilter = true,
  showColumnSettings = true,
  showExport = true,
  showRefresh = true,
  showFullscreen = true,
  showRowSelection = false,
  showPagination = true,
  pageSize = 10,
  size = "middle",
  bordered = false,
  striped = true,
  onSearch,
  onFilter,
  onExport,
  onRefresh,
  onRowSelect,
  onAdd,
  onEdit,
  onDelete,
  rowKey = "id",
  className = "",
  style = {},
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [filteredData, setFilteredData] = useState(dataSource);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});

  /**
   * 初始化可见列
   */
  useEffect(() => {
    const defaultVisible = columns
      .filter((col) => col.defaultVisible !== false)
      .map((col) => col.key);
    setVisibleColumns(defaultVisible);
  }, [columns]);

  /**
   * 更新过滤后的数据
   */
  useEffect(() => {
    let filtered = [...dataSource];

    // 搜索过滤
    if (searchValue) {
      const searchableColumns = columns.filter(
        (col) => col.searchable !== false
      );
      filtered = filtered.filter((record) => {
        return searchableColumns.some((col) => {
          const value = record[col.dataIndex];
          return (
            value &&
            value.toString().toLowerCase().includes(searchValue.toLowerCase())
          );
        });
      });
    }

    // 列过滤
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue && filterValue.length > 0) {
        filtered = filtered.filter((record) => {
          const value = record[key];
          return filterValue.includes(value);
        });
      }
    });

    // 排序
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredData(filtered);
    onFilter?.(filters);
  }, [dataSource, searchValue, filters, sortConfig, columns, onFilter]);

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setCurrentPage(1);
    onSearch?.(value);
  };

  /**
   * 处理列过滤
   */
  const handleColumnFilter = (columnKey: string, filterValues: any[]) => {
    setFilters((prev) => ({
      ...prev,
      [columnKey]: filterValues,
    }));
    setCurrentPage(1);
  };

  /**
   * 处理排序
   */
  const handleSort = (columnKey: string) => {
    setSortConfig((prev) => {
      if (prev?.key === columnKey) {
        if (prev.direction === "asc") {
          return { key: columnKey, direction: "desc" };
        } else {
          return null; // 取消排序
        }
      } else {
        return { key: columnKey, direction: "asc" };
      }
    });
  };

  /**
   * 处理列可见性切换
   */
  const handleColumnVisibility = (columnKey: string, visible: boolean) => {
    setVisibleColumns((prev) => {
      if (visible) {
        return [...prev, columnKey];
      } else {
        return prev.filter((key) => key !== columnKey);
      }
    });
  };

  /**
   * 处理导出
   */
  const handleExport = () => {
    const exportData = selectedRows.length > 0 ? selectedRows : filteredData;
    onExport?.(exportData);
    message.success(`导出 ${exportData.length} 条数据`);
  };

  /**
   * 处理刷新
   */
  const handleRefresh = () => {
    setSearchValue("");
    setFilters({});
    setSortConfig(null);
    setCurrentPage(1);
    onRefresh?.();
    message.success("数据已刷新");
  };

  /**
   * 处理全屏切换
   */
  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  /**
   * 处理行选择
   */
  const handleRowSelection = {
    selectedRowKeys: selectedRows.map((row) =>
      typeof rowKey === "function" ? rowKey(row) : row[rowKey]
    ),
    onChange: (selectedRowKeys: React.Key[], selectedRows: any[]) => {
      setSelectedRows(selectedRows);
      onRowSelect?.(selectedRows);
    },
    onSelectAll: (
      selected: boolean,
      selectedRows: any[],
      changeRows: any[]
    ) => {
      console.log("Select all:", selected, selectedRows, changeRows);
    },
  };

  /**
   * 构建表格列
   */
  const tableColumns: ColumnsType<any> = useMemo(() => {
    return columns
      .filter((col) => visibleColumns.includes(col.key))
      .map((col) => {
        const column: any = {
          key: col.key,
          title: (
            <Space size="small">
              <span>{col.title}</span>
              {col.sortable && (
                <Space size={0}>
                  <Button
                    type="text"
                    size="small"
                    icon={
                      sortConfig?.key === col.key &&
                      sortConfig.direction === "asc" ? (
                        <SortAscendingOutlined style={{ color: "#1890ff" }} />
                      ) : (
                        <SortAscendingOutlined />
                      )
                    }
                    onClick={() => handleSort(col.key)}
                    style={{ padding: 0, minWidth: "auto" }}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={
                      sortConfig?.key === col.key &&
                      sortConfig.direction === "desc" ? (
                        <SortDescendingOutlined style={{ color: "#1890ff" }} />
                      ) : (
                        <SortDescendingOutlined />
                      )
                    }
                    onClick={() => handleSort(col.key)}
                    style={{ padding: 0, minWidth: "auto" }}
                  />
                </Space>
              )}
            </Space>
          ),
          dataIndex: col.dataIndex,
          width: col.width,
          fixed: col.fixed,
          align: col.align,
          ellipsis: col.ellipsis,
          render: col.render,
        };

        // 添加过滤功能
        if (col.filterable && col.filters) {
          column.filters = col.filters;
          column.onFilter = (value: any, record: any) => {
            return record[col.dataIndex] === value;
          };
          column.filteredValue = filters[col.key] || null;
        }

        return column;
      });
  }, [columns, visibleColumns, sortConfig, filters]);

  /**
   * 添加操作列
   */
  if (onEdit || onDelete) {
    tableColumns.push({
      key: "actions",
      title: "操作",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          {onEdit && (
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
              />
            </Tooltip>
          )}
          {onDelete && (
            <Popconfirm
              title="确定要删除这条记录吗？"
              onConfirm={() => onDelete(record)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    });
  }

  /**
   * 渲染工具栏
   */
  const renderToolbar = () => (
    <Row
      gutter={[16, 16]}
      align="middle"
      justify="space-between"
      className="table-toolbar"
    >
      <Col flex="auto">
        <Space size="middle" wrap className="table-actions-left">
          {/* 搜索 */}
          {showSearch && (
            <Search
              placeholder="搜索表格数据..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              className="table-search"
              allowClear
            />
          )}

          {/* 添加按钮 */}
          {onAdd && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAdd}
              className="table-add-btn"
            >
              新增
            </Button>
          )}

          {/* 批量操作 */}
          {selectedRows.length > 0 && (
            <Space>
              <Badge count={selectedRows.length}>
                <Text>已选择</Text>
              </Badge>
              <Button size="small">批量删除</Button>
              <Button size="small">批量导出</Button>
            </Space>
          )}
        </Space>
      </Col>

      <Col>
        <Space size="small" className="table-actions-right">
          {/* 刷新 */}
          {showRefresh && (
            <Tooltip title="刷新">
              <Button
                type="text"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                className="table-action-btn"
              />
            </Tooltip>
          )}

          {/* 导出 */}
          {showExport && (
            <Tooltip title="导出数据">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={filteredData.length === 0}
                className="table-action-btn"
              />
            </Tooltip>
          )}

          {/* 列设置 */}
          {showColumnSettings && (
            <Dropdown
              trigger={["click"]}
              popupRender={() => (
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#fff",
                    borderRadius: "6px",
                    boxShadow: "0 6px 16px 0 rgba(0, 0, 0, 0.08)",
                  }}
                >
                  <div style={{ marginBottom: "8px", fontWeight: 500 }}>
                    显示列
                  </div>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {columns.map((col) => (
                      <div key={col.key} style={{ padding: "4px 0" }}>
                        <Checkbox
                          checked={visibleColumns.includes(col.key)}
                          onChange={(e) =>
                            handleColumnVisibility(col.key, e.target.checked)
                          }
                        >
                          {col.title}
                        </Checkbox>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            >
              <Tooltip title="列设置">
                <Button type="text" icon={<SettingOutlined />} />
              </Tooltip>
            </Dropdown>
          )}

          {/* 全屏 */}
          {showFullscreen && (
            <Tooltip title={isFullscreen ? "退出全屏" : "全屏"}>
              <Button
                type="text"
                icon={
                  isFullscreen ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )
                }
                onClick={handleFullscreen}
              />
            </Tooltip>
          )}
        </Space>
      </Col>
    </Row>
  );

  /**
   * 渲染统计信息
   */
  const renderStats = () => (
    <Row gutter={16} style={{ marginBottom: "16px" }}>
      <Col>
        <Text type="secondary">
          共 {filteredData.length} 条数据
          {searchValue && <span>，搜索 "{searchValue}" 的结果</span>}
          {selectedRows.length > 0 && (
            <span>，已选择 {selectedRows.length} 条</span>
          )}
        </Text>
      </Col>
    </Row>
  );

  const tableProps: TableProps<any> = {
    columns: tableColumns,
    dataSource: filteredData,
    loading,
    size,
    bordered,
    rowKey,
    scroll: { x: "max-content" },
    pagination: showPagination
      ? {
          current: currentPage,
          pageSize: currentPageSize,
          total: filteredData.length,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setCurrentPageSize(size || pageSize);
          },
        }
      : false,
    rowSelection: showRowSelection ? handleRowSelection : undefined,
    className: `${striped ? "striped-table" : ""} ${className}`,
    style: isFullscreen
      ? {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          backgroundColor: "#fff",
          padding: "16px",
          ...style,
        }
      : style,
  };

  return (
    <>
      <Card
        title={title && showHeader ? title : undefined}
        bordered={false}
        className={`responsive-table-card ${isFullscreen ? "fullscreen" : ""}`}
        style={
          isFullscreen
            ? {
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1000,
                margin: 0,
                borderRadius: 0,
              }
            : {}
        }
        styles={{
          body: { padding: isFullscreen ? "24px" : "16px" },
        }}
      >
        {/* 工具栏 */}
        {renderToolbar()}

        <Divider style={{ margin: "16px 0" }} />

        {/* 统计信息 */}
        {renderStats()}

        {/* 表格 */}
        <Table {...tableProps} />
      </Card>

      {/* 样式 */}
      <style>{`
        .striped-table .ant-table-tbody > tr:nth-child(odd) > td {
          background-color: #fafafa;
        }
        
        .striped-table .ant-table-tbody > tr:hover > td {
          background-color: #e6f7ff !important;
        }
        
        .ant-table-thead > tr > th {
          background-color: #f5f5f5;
          font-weight: 600;
        }
        
        .ant-table-tbody > tr > td {
          transition: background-color 0.2s;
        }
        
        @media (max-width: 768px) {
          .ant-table {
            font-size: 12px;
          }
          
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td {
            padding: 8px 4px;
          }
        }
      `}</style>
    </>
  );
};

export default ResponsiveTable;
