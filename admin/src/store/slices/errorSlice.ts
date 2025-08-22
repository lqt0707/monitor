/**
 * 错误状态管理 Slice
 * 管理错误日志和错误聚合数据
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { message } from "antd";
import apiClient from "../../services/api";
import type {
  ErrorLog,
  ErrorAggregation,
  QueryParams,
  ErrorStats,
} from "../../types/monitor";

// 错误状态接口
interface ErrorState {
  // 错误日志相关
  errorLogs: ErrorLog[];
  errorLogsTotal: number;
  errorLogsLoading: boolean;

  // 错误聚合相关
  errorAggregations: ErrorAggregation[];
  errorAggregationsTotal: number;
  errorAggregationsLoading: boolean;

  // 统计数据相关
  errorStats: ErrorStats | null;
  errorTrends: Array<{ date: string; count: number }>;
  statsLoading: boolean;

  // 当前选中的错误
  selectedError: ErrorLog | ErrorAggregation | null;

  // 通用状态
  error: string | null;
}

// 初始状态
const initialState: ErrorState = {
  errorLogs: [],
  errorLogsTotal: 0,
  errorLogsLoading: false,

  errorAggregations: [],
  errorAggregationsTotal: 0,
  errorAggregationsLoading: false,

  errorStats: null,
  errorTrends: [],
  statsLoading: false,

  selectedError: null,
  error: null,
};

/**
 * 获取错误日志列表
 * @param params 查询参数
 */
export const fetchErrorLogs = createAsyncThunk(
  "error/fetchErrorLogs",
  async (params: QueryParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.errorLogs.getList(params);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "获取错误日志失败";
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 获取错误聚合列表
 * @param params 查询参数
 */
export const fetchErrorAggregations = createAsyncThunk(
  "error/fetchErrorAggregations",
  async (params: QueryParams, { rejectWithValue }) => {
    try {
      const response = await apiClient.errorAggregations.getList(params);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "获取错误聚合失败";
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 获取错误统计数据
 * @param projectId 项目ID（可选）
 */
export const fetchErrorStats = createAsyncThunk(
  "error/fetchErrorStats",
  async (projectId?: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.stats.getErrorStats(projectId);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "获取统计数据失败";
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 获取错误趋势数据
 * @param params 查询参数
 */
export const fetchErrorTrends = createAsyncThunk(
  "error/fetchErrorTrends",
  async (
    params: { projectId?: string; days?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.stats.getErrorTrends(
        params.projectId,
        params.days
      );
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "获取趋势数据失败";
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 标记错误为已解决
 * @param id 错误聚合ID
 */
export const markErrorResolved = createAsyncThunk(
  "error/markResolved",
  async (id: number, { rejectWithValue }) => {
    try {
      await apiClient.errorAggregations.markResolved(id);
      message.success("已标记为已解决");
      return id;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "操作失败";
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 重新打开错误
 * @param id 错误聚合ID
 */
export const reopenError = createAsyncThunk(
  "error/reopen",
  async (id: number, { rejectWithValue }) => {
    try {
      await apiClient.errorAggregations.reopen(id);
      message.success("已重新打开");
      return id;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "操作失败";
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 错误状态 Slice
 */
const errorSlice = createSlice({
  name: "error",
  initialState,
  reducers: {
    /**
     * 清除错误信息
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * 设置选中的错误
     * @param state 当前状态
     * @param action 包含错误信息的 action
     */
    setSelectedError: (
      state,
      action: PayloadAction<ErrorLog | ErrorAggregation | null>
    ) => {
      state.selectedError = action.payload;
    },

    /**
     * 清除错误日志列表
     */
    clearErrorLogs: (state) => {
      state.errorLogs = [];
      state.errorLogsTotal = 0;
    },

    /**
     * 清除错误聚合列表
     */
    clearErrorAggregations: (state) => {
      state.errorAggregations = [];
      state.errorAggregationsTotal = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取错误日志列表
      .addCase(fetchErrorLogs.pending, (state) => {
        state.errorLogsLoading = true;
        state.error = null;
      })
      .addCase(fetchErrorLogs.fulfilled, (state, action) => {
        state.errorLogsLoading = false;
        state.errorLogs = action.payload.data;
        state.errorLogsTotal = action.payload.total;
      })
      .addCase(fetchErrorLogs.rejected, (state, action) => {
        state.errorLogsLoading = false;
        state.error = action.payload as string;
      })

      // 获取错误聚合列表
      .addCase(fetchErrorAggregations.pending, (state) => {
        state.errorAggregationsLoading = true;
        state.error = null;
      })
      .addCase(fetchErrorAggregations.fulfilled, (state, action) => {
        state.errorAggregationsLoading = false;
        state.errorAggregations = action.payload.data;
        state.errorAggregationsTotal = action.payload.total;
      })
      .addCase(fetchErrorAggregations.rejected, (state, action) => {
        state.errorAggregationsLoading = false;
        state.error = action.payload as string;
      })

      // 获取统计数据
      .addCase(fetchErrorStats.pending, (state) => {
        state.statsLoading = true;
        state.error = null;
      })
      .addCase(fetchErrorStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.errorStats = action.payload;
      })
      .addCase(fetchErrorStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload as string;
      })

      // 获取趋势数据
      .addCase(fetchErrorTrends.fulfilled, (state, action) => {
        state.errorTrends = action.payload;
      })

      // 标记已解决
      .addCase(markErrorResolved.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.errorAggregations.findIndex(
          (item) => item.id === id
        );
        if (index !== -1) {
          (state.errorAggregations[index] as any).status = "resolved";
        }
      })

      // 重新打开
      .addCase(reopenError.fulfilled, (state, action) => {
        const id = action.payload;
        const index = state.errorAggregations.findIndex(
          (item) => item.id === id
        );
        if (index !== -1) {
          (state.errorAggregations[index] as any).status = "open";
        }
      });
  },
});

// 导出 actions
export const {
  clearError,
  setSelectedError,
  clearErrorLogs,
  clearErrorAggregations,
} = errorSlice.actions;

// 导出 reducer
export default errorSlice.reducer;
