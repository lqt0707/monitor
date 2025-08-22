import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Input,
  AutoComplete,
  Button,
  Drawer,
  List,
  Typography,
  Space,
  Tag,
  Avatar,
  Empty,
  Divider,
  Tooltip,
  Badge,
} from "antd";
import "../styles/responsive-components.css";
import {
  SearchOutlined,
  CloseOutlined,
  HistoryOutlined,
  DeleteOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  DashboardOutlined,
  BarChartOutlined,
  BugOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Text, Title } = Typography;
const { Search } = Input;

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: "page" | "function" | "data" | "user" | "setting";
  url?: string;
  icon?: React.ReactNode;
  tags?: string[];
  score?: number;
  category?: string;
}

interface SearchHistory {
  id: string;
  query: string;
  timestamp: Date;
  results?: number;
}

interface ResponsiveSearchProps {
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  showHistory?: boolean;
  showFilters?: boolean;
  maxResults?: number;
  onSearch?: (query: string, results: SearchResult[]) => void;
  onResultClick?: (result: SearchResult) => void;
}

/**
 * 响应式搜索组件
 * 提供全局搜索功能和智能建议
 * @param props - 组件属性
 * @returns 响应式搜索组件
 */
const ResponsiveSearch: React.FC<ResponsiveSearchProps> = ({
  className = "",
  style = {},
  placeholder = "搜索页面、功能、数据...",
  showHistory = true,
  showFilters = true,
  maxResults = 20,
  onSearch,
  onResultClick,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"relevance" | "name" | "type">(
    "relevance"
  );

  const navigate = useNavigate();
  const searchRef = useRef<any>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 获取搜索结果图标
   * @param type - 结果类型
   */
  const getResultIcon = (type: SearchResult["type"]) => {
    const iconMap = {
      page: <FileTextOutlined style={{ color: "#1890ff" }} />,
      function: <SettingOutlined style={{ color: "#52c41a" }} />,
      data: <BarChartOutlined style={{ color: "#faad14" }} />,
      user: <UserOutlined style={{ color: "#722ed1" }} />,
      setting: <SettingOutlined style={{ color: "#13c2c2" }} />,
    };
    return iconMap[type] || <FileTextOutlined style={{ color: "#1890ff" }} />;
  };

  /**
   * 获取类型标签颜色
   * @param type - 结果类型
   */
  const getTypeColor = (type: SearchResult["type"]) => {
    const colorMap = {
      page: "blue",
      function: "green",
      data: "orange",
      user: "purple",
      setting: "cyan",
    };
    return colorMap[type] || "default";
  };

  /**
   * 获取类型显示名称
   * @param type - 结果类型
   */
  const getTypeName = (type: SearchResult["type"]) => {
    const nameMap = {
      page: "页面",
      function: "功能",
      data: "数据",
      user: "用户",
      setting: "设置",
    };
    return nameMap[type] || type;
  };

  /**
   * 模拟搜索数据
   */
  const mockSearchData: SearchResult[] = [
    {
      id: "1",
      title: "错误监控",
      description: "查看和管理系统错误日志",
      type: "page",
      url: "/errors",
      icon: <BugOutlined />,
      tags: ["监控", "错误", "日志"],
      category: "监控管理",
    },
    {
      id: "2",
      title: "自定义仪表板",
      description: "创建和配置个性化数据面板",
      type: "page",
      url: "/custom-dashboard",
      icon: <DashboardOutlined />,
      tags: ["仪表板", "图表", "数据"],
      category: "数据分析",
    },
    {
      id: "3",
      title: "系统设置",
      description: "配置系统参数和选项",
      type: "setting",
      url: "/settings",
      icon: <SettingOutlined />,
      tags: ["设置", "配置", "系统"],
      category: "系统管理",
    },
    {
      id: "4",
      title: "用户管理",
      description: "管理用户账户和权限",
      type: "function",
      url: "/users",
      icon: <UserOutlined />,
      tags: ["用户", "权限", "管理"],
      category: "用户管理",
    },
    {
      id: "5",
      title: "性能数据",
      description: "查看系统性能指标和统计",
      type: "data",
      url: "/performance",
      icon: <BarChartOutlined />,
      tags: ["性能", "统计", "指标"],
      category: "性能监控",
    },
  ];

  /**
   * 执行搜索
   * @param searchQuery - 搜索查询
   */
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      // 模拟API调用延迟
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 模拟搜索逻辑
      let filteredResults = mockSearchData.filter((item) => {
        const searchText = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(searchText) ||
          item.description.toLowerCase().includes(searchText) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(searchText)) ||
          item.category?.toLowerCase().includes(searchText)
        );
      });

      // 类型过滤
      if (selectedType !== "all") {
        filteredResults = filteredResults.filter(
          (item) => item.type === selectedType
        );
      }

      // 计算相关性分数
      filteredResults = filteredResults.map((item) => {
        let score = 0;
        const searchText = searchQuery.toLowerCase();

        if (item.title.toLowerCase().includes(searchText)) score += 10;
        if (item.description.toLowerCase().includes(searchText)) score += 5;
        if (item.tags?.some((tag) => tag.toLowerCase().includes(searchText)))
          score += 3;
        if (item.category?.toLowerCase().includes(searchText)) score += 2;

        return { ...item, score };
      });

      // 排序
      if (sortBy === "relevance") {
        filteredResults.sort((a, b) => (b.score || 0) - (a.score || 0));
      } else if (sortBy === "name") {
        filteredResults.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === "type") {
        filteredResults.sort((a, b) => a.type.localeCompare(b.type));
      }

      // 限制结果数量
      filteredResults = filteredResults.slice(0, maxResults);

      setResults(filteredResults);
      onSearch?.(searchQuery, filteredResults);

      // 添加到搜索历史
      if (searchQuery.trim()) {
        addToHistory(searchQuery, filteredResults.length);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 添加到搜索历史
   * @param searchQuery - 搜索查询
   * @param resultCount - 结果数量
   */
  const addToHistory = (searchQuery: string, resultCount: number) => {
    const newHistoryItem: SearchHistory = {
      id: `history_${Date.now()}`,
      query: searchQuery,
      timestamp: new Date(),
      results: resultCount,
    };

    setHistory((prev) => {
      const filtered = prev.filter((item) => item.query !== searchQuery);
      return [newHistoryItem, ...filtered].slice(0, 10); // 保留最近10条
    });
  };

  /**
   * 清除搜索历史
   */
  const clearHistory = () => {
    setHistory([]);
  };

  /**
   * 删除历史项
   * @param id - 历史项ID
   */
  const removeHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * 处理结果点击
   * @param result - 搜索结果
   */
  const handleResultClick = (result: SearchResult) => {
    if (result.url) {
      navigate(result.url);
    }
    onResultClick?.(result);
    setVisible(false);
    setQuery("");
  };

  /**
   * 处理历史项点击
   * @param historyItem - 历史项
   */
  const handleHistoryClick = (historyItem: SearchHistory) => {
    setQuery(historyItem.query);
    performSearch(historyItem.query);
  };

  /**
   * 防抖搜索
   */
  const debouncedSearch = (searchQuery: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
  };

  /**
   * 处理搜索输入变化
   */
  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setResults([]);
    }
  };

  /**
   * 获取过滤选项
   */
  const filterOptions = [
    { label: "全部", value: "all" },
    { label: "页面", value: "page" },
    { label: "功能", value: "function" },
    { label: "数据", value: "data" },
    { label: "用户", value: "user" },
    { label: "设置", value: "setting" },
  ];

  /**
   * 获取排序选项
   */
  const sortOptions = [
    { label: "相关性", value: "relevance" },
    { label: "名称", value: "name" },
    { label: "类型", value: "type" },
  ];

  /**
   * 渲染搜索结果
   */
  const renderResults = () => {
    if (loading) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <Text type="secondary">搜索中...</Text>
        </div>
      );
    }

    if (query && results.length === 0) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="未找到相关结果"
            style={{ margin: 0 }}
          >
            <Text type="secondary">尝试使用不同的关键词</Text>
          </Empty>
        </div>
      );
    }

    if (results.length > 0) {
      return (
        <List
          size="small"
          dataSource={results}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderRadius: "4px",
                margin: "4px 8px",
              }}
              className="search-result-item"
              onClick={() => handleResultClick(item)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    size="small"
                    icon={item.icon || getResultIcon(item.type)}
                  />
                }
                title={
                  <Space size="small">
                    <Text strong style={{ fontSize: "14px" }}>
                      {item.title}
                    </Text>
                    <Tag color={getTypeColor(item.type)}>
                      {getTypeName(item.type)}
                    </Tag>
                    {item.score && item.score > 8 && (
                      <Badge status="success" text="推荐" />
                    )}
                  </Space>
                }
                description={
                  <div>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: "12px",
                        display: "block",
                        marginBottom: "4px",
                      }}
                    >
                      {item.description}
                    </Text>
                    {item.tags && item.tags.length > 0 && (
                      <Space size={4}>
                        {item.tags.slice(0, 3).map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                        {item.tags.length > 3 && (
                          <Text type="secondary" style={{ fontSize: "11px" }}>
                            +{item.tags.length - 3}
                          </Text>
                        )}
                      </Space>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      );
    }

    return null;
  };

  /**
   * 渲染搜索历史
   */
  const renderHistory = () => {
    if (!showHistory || history.length === 0) return null;

    return (
      <div>
        <div
          style={{
            padding: "8px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text type="secondary" style={{ fontSize: "12px" }}>
            <HistoryOutlined style={{ marginRight: "4px" }} />
            搜索历史
          </Text>
          <Button
            type="text"
            size="small"
            onClick={clearHistory}
            style={{ fontSize: "11px" }}
          >
            清空
          </Button>
        </div>

        <List
          size="small"
          dataSource={history.slice(0, 5)}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              style={{
                padding: "8px 16px",
                cursor: "pointer",
              }}
              actions={[
                <Button
                  key="delete"
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHistoryItem(item.id);
                  }}
                />,
              ]}
              onClick={() => handleHistoryClick(item)}
            >
              <List.Item.Meta
                title={<Text style={{ fontSize: "13px" }}>{item.query}</Text>}
                description={
                  <Text type="secondary" style={{ fontSize: "11px" }}>
                    {item.results} 个结果 •{" "}
                    {item.timestamp.toLocaleTimeString()}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      </div>
    );
  };

  /**
   * 渲染过滤器
   */
  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div
        style={{
          padding: "8px 16px",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <Space size="small">
          <FilterOutlined style={{ fontSize: "12px", color: "#666" }} />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            类型:
          </Text>
          {filterOptions.map((option) => (
            <Tag.CheckableTag
              key={option.value}
              checked={selectedType === option.value}
              onChange={() => {
                setSelectedType(option.value);
                if (query) {
                  performSearch(query);
                }
              }}
              style={{ fontSize: "11px" }}
            >
              {option.label}
            </Tag.CheckableTag>
          ))}
        </Space>

        <Space size="small">
          <SortAscendingOutlined style={{ fontSize: "12px", color: "#666" }} />
          <Text type="secondary" style={{ fontSize: "12px" }}>
            排序:
          </Text>
          {sortOptions.map((option) => (
            <Tag.CheckableTag
              key={option.value}
              checked={sortBy === option.value}
              onChange={() => {
                setSortBy(option.value as any);
                if (query) {
                  performSearch(query);
                }
              }}
              style={{ fontSize: "11px" }}
            >
              {option.label}
            </Tag.CheckableTag>
          ))}
        </Space>
      </div>
    );
  };

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K 打开搜索
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setVisible(true);
        setTimeout(() => {
          searchRef.current?.focus();
        }, 100);
      }

      // ESC 关闭搜索
      if (e.key === "Escape" && visible) {
        setVisible(false);
        setQuery("");
        setResults([]);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible]);

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className={`responsive-search-trigger ${className}`} style={style}>
        <Tooltip title="搜索 (Ctrl+K)">
          <Button
            type="text"
            icon={<SearchOutlined />}
            onClick={() => setVisible(true)}
            className="search-trigger-btn"
          />
        </Tooltip>
      </div>

      <Drawer
        title={null}
        placement="top"
        closable={false}
        onClose={() => setVisible(false)}
        open={visible}
        height="auto"
        className="responsive-search-drawer"
        style={{
          maxHeight: "80vh",
        }}
        styles={{
          body: { padding: 0 },
        }}
      >
        <div className="search-panel-header">
          <div className="search-panel-title">
            <SearchOutlined className="search-panel-icon" />
            <span>全局搜索</span>
            <Text type="secondary" className="search-shortcut">
              (Ctrl+K)
            </Text>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setVisible(false)}
              className="search-close-btn"
            />
          </div>
          <Search
            ref={searchRef}
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            onSearch={performSearch}
            size="large"
            allowClear
            autoFocus
            className="search-input-main"
          />
        </div>

        {renderFilters()}

        <div className="search-content-area">
          {query ? renderResults() : renderHistory()}
        </div>

        {results.length > 0 && (
          <div className="search-results-footer">
            <Text type="secondary" className="results-count">
              找到 {results.length} 个结果
            </Text>
          </div>
        )}
      </Drawer>

      <style>{`
        .search-result-item:hover {
          background-color: #f5f5f5;
        }
        
        .ant-drawer-header {
          border-bottom: 1px solid #f0f0f0;
        }
        
        .ant-list-item {
          transition: background-color 0.2s;
        }
      `}</style>
    </>
  );
};

export default ResponsiveSearch;
