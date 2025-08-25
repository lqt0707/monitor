/**
 * 响应式组件库统一导出文件
 * 提供所有响应式组件的统一入口
 */

// 基础响应式组件
export { default as ResponsiveHeader } from "./ResponseHeader/ResponsiveHeader";
export { default as ResponsiveTable } from "./ResponsiveTable";
export { default as ResponsiveForm } from "./ResponsiveForm";
export { default as ResponsiveCard } from "./ResponsiveCard";
export { default as ResponsiveModal } from "./ResponsiveModal";
export {
  default as ResponsiveLayout,
  ResponsiveLayoutItem,
  Container,
  Section,
} from "./ResponsiveLayout";

// 功能性响应式组件
export { default as ResponsiveSearch } from "./ResponsiveSearch";
export { default as ResponsiveNotification } from "./ResponsiveNotification";
export { default as ResponsiveLoading } from "./ResponsiveLoading";
export { default as ResponsiveEmpty } from "./ResponsiveEmpty";
export { default as ErrorBoundary } from "./ErrorBoundary";

// 响应式模态框便捷方法
export {
  showModal,
  showInfo,
  showSuccess,
  showWarning,
  showError,
  showConfirm,
} from "./ResponsiveModal";

// 响应式加载组件便捷导出
export {
  PageLoading,
  CardLoading,
  TableLoading,
  ChartLoading,
  ButtonLoading,
} from "./ResponsiveLoading";

// 响应式空状态组件便捷导出
export {
  SearchEmpty,
  DataEmpty,
  NetworkEmpty,
  ErrorEmpty,
  TableEmpty,
} from "./ResponsiveEmpty";

// 响应式通知管理器
export { NotificationManager } from "./ResponsiveNotification";

// 注意：类型定义需要在各个组件文件中单独导出
// 如需使用类型定义，请直接从对应的组件文件中导入

// 源代码查看器组件
export { default as SourceCodeViewer } from './SourceCodeViewer';
export * from './SourceCodeViewer';
