import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api';
import type { SourceCodeSourcemapAssociation } from '../../types/sourceCodeSourcemapIntegration';

interface ProjectConfig {
  id: string;
  name: string;
  projectId: string;
}

interface SourceCodeSourcemapState {
  projects: ProjectConfig[];
  associations: SourceCodeSourcemapAssociation[];
  loading: boolean;
  associationsLoading: boolean;
  error: string | null;
}

// 获取项目列表
export const fetchProjects = createAsyncThunk(
  'sourceCodeSourcemap/fetchProjects',
  async () => {
    const response = await apiClient.projects.getList();
    // 确保id是字符串类型
    return (response || []).map(project => ({
      ...project,
      id: String(project.id),
      projectId: String(project.projectId)
    }));
  }
);

// 获取关联信息
export const fetchAssociations = createAsyncThunk(
  'sourceCodeSourcemap/fetchAssociations',
  async (projectId: string) => {
    if (!projectId) return [];
    
    const response = await apiClient.sourceCodeSourcemapIntegration.getAssociation(projectId);
    
    // 将后端返回的对象转换为前端期望的关联数组格式
    if (response && response.sourceCodeVersion) {
      const version = response.sourceCodeVersion;
      return [{
        id: version.id.toString(),
        projectId: version.projectId,
        sourceCodeVersionId: version.id.toString(),
        sourcemapVersionId: version.id.toString(),
        sourceCodeVersion: version.version,
        sourcemapVersion: version.sourcemapVersion || '',
        isActive: version.isActive,
        createdAt: version.createdAt,
        updatedAt: version.updatedAt
      }];
    }
    return [];
  }
);

// 上传源代码和sourcemap
export const uploadSourceCodeAndSourcemap = createAsyncThunk(
  'sourceCodeSourcemap/upload',
  async (formData: FormData) => {
    const response = await apiClient.sourceCodeSourcemapIntegration.uploadSourceCodeAndSourcemap(formData);
    return response;
  }
);

// 设置活跃关联
export const setActiveAssociation = createAsyncThunk(
  'sourceCodeSourcemap/setActive',
  async ({ projectId, associationId }: { projectId: string; associationId: string }) => {
    const response = await apiClient.sourceCodeSourcemapIntegration.setActiveAssociation(projectId, associationId);
    return response;
  }
);

// 删除关联
export const deleteAssociation = createAsyncThunk(
  'sourceCodeSourcemap/delete',
  async ({ projectId, associationId }: { projectId: string; associationId: string }) => {
    const response = await apiClient.sourceCodeSourcemapIntegration.deleteAssociation(projectId, associationId);
    return response;
  }
);

const initialState: SourceCodeSourcemapState = {
  projects: [],
  associations: [],
  loading: false,
  associationsLoading: false,
  error: null,
};

const sourceCodeSourcemapSlice = createSlice({
  name: 'sourceCodeSourcemap',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setAssociations: (state, action: PayloadAction<SourceCodeSourcemapAssociation[]>) => {
      state.associations = action.payload;
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
        state.error = action.error.message || '获取项目列表失败';
      })
      
      // 获取关联信息
      .addCase(fetchAssociations.pending, (state) => {
        state.associationsLoading = true;
        state.error = null;
      })
      .addCase(fetchAssociations.fulfilled, (state, action) => {
        state.associationsLoading = false;
        state.associations = action.payload;
      })
      .addCase(fetchAssociations.rejected, (state, action) => {
        state.associationsLoading = false;
        state.error = action.error.message || '获取关联信息失败';
      })
      
      // 上传
      .addCase(uploadSourceCodeAndSourcemap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadSourceCodeAndSourcemap.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(uploadSourceCodeAndSourcemap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '上传失败';
      })
      
      // 设置活跃
      .addCase(setActiveAssociation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setActiveAssociation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(setActiveAssociation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '设置活跃失败';
      })
      
      // 删除
      .addCase(deleteAssociation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAssociation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteAssociation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '删除失败';
      });
  },
});

export const { clearError, setAssociations } = sourceCodeSourcemapSlice.actions;
export default sourceCodeSourcemapSlice.reducer;