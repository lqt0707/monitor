/**
 * 项目状态管理 Slice
 * 管理项目配置数据
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { message } from 'antd';
import apiClient from '../../services/api';
import type { ProjectConfig } from '../../types/monitor';

// 项目状态接口
interface ProjectState {
  projects: ProjectConfig[];
  currentProject: ProjectConfig | null;
  loading: boolean;
  error: string | null;
}

// 初始状态
const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
};

/**
 * 获取项目列表
 */
export const fetchProjects = createAsyncThunk(
  'project/fetchProjects',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.projects.getList();
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '获取项目列表失败';
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 获取项目详情
 * @param id 项目ID
 */
export const fetchProjectDetail = createAsyncThunk(
  'project/fetchProjectDetail',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.projects.getDetail(id);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '获取项目详情失败';
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 创建项目
 * @param project 项目数据
 */
export const createProject = createAsyncThunk(
  'project/createProject',
  async (project: Omit<ProjectConfig, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await apiClient.projects.create(project);
      message.success('项目创建成功');
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '创建项目失败';
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 更新项目
 * @param params 更新参数
 */
export const updateProject = createAsyncThunk(
  'project/updateProject',
  async (params: { id: string; project: Partial<ProjectConfig> }, { rejectWithValue }) => {
    try {
      const response = await apiClient.projects.update(params.id, params.project);
      message.success('项目更新成功');
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '更新项目失败';
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 删除项目
 * @param id 项目ID
 */
export const deleteProject = createAsyncThunk(
  'project/deleteProject',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiClient.projects.delete(id);
      message.success('项目删除成功');
      return id;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '删除项目失败';
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 项目状态 Slice
 */
const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    /**
     * 清除错误信息
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * 设置当前项目
     * @param state 当前状态
     * @param action 包含项目信息的 action
     */
    setCurrentProject: (state, action: PayloadAction<ProjectConfig | null>) => {
      state.currentProject = action.payload;
    },

    /**
     * 清除项目列表
     */
    clearProjects: (state) => {
      state.projects = [];
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取项目列表
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // 获取项目详情
      .addCase(fetchProjectDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjectDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // 创建项目
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projects.push(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // 更新项目
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.projects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload;
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // 删除项目
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload;
        state.projects = state.projects.filter(p => p.id !== id);
        if (state.currentProject?.id === id) {
          state.currentProject = null;
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// 导出 actions
export const {
  clearError,
  setCurrentProject,
  clearProjects,
} = projectSlice.actions;

// 导出 reducer
export default projectSlice.reducer;