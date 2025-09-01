import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api';
import type { SourceCodeLocationResult } from '../../types/sourceCodeSourcemapIntegration';

interface ErrorInfo {
  projectId: string;
  version: string;
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  errorMessage: string;
  stackTrace?: string;
}

interface ErrorSourceCodeState {
  locationResult: SourceCodeLocationResult | null;
  loading: boolean;
  preparingAI: boolean;
  error: string | null;
}

const initialState: ErrorSourceCodeState = {
  locationResult: null,
  loading: false,
  preparingAI: false,
  error: null,
};

// 定位源代码
export const locateSourceCode = createAsyncThunk(
  'errorSourceCode/locate',
  async (errorInfo: ErrorInfo) => {
    const response = await apiClient.sourceCodeSourcemapIntegration.locateSourceCodeByError({
      projectId: errorInfo.projectId,
      version: errorInfo.version,
      fileName: errorInfo.fileName,
      lineNumber: errorInfo.lineNumber,
      columnNumber: errorInfo.columnNumber,
      errorMessage: errorInfo.errorMessage,
    });
    return response;
  }
);

// 准备AI诊断上下文
export const prepareAIContext = createAsyncThunk(
  'errorSourceCode/prepareAI',
  async ({ errorInfo, contextSize = 10 }: { errorInfo: ErrorInfo; contextSize?: number }) => {
    const response = await apiClient.sourceCodeSourcemapIntegration.prepareAIContext({
      projectId: errorInfo.projectId,
      version: errorInfo.version,
      errorInfo: {
        fileName: errorInfo.fileName,
        lineNumber: errorInfo.lineNumber,
        columnNumber: errorInfo.columnNumber,
        errorMessage: errorInfo.errorMessage,
        stackTrace: errorInfo.stackTrace,
      },
      contextSize,
    });
    return response;
  }
);

const errorSourceCodeSlice = createSlice({
  name: 'errorSourceCode',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLocationResult: (state) => {
      state.locationResult = null;
    },
    setLocationResult: (state, action: PayloadAction<SourceCodeLocationResult>) => {
      state.locationResult = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // 定位源代码
      .addCase(locateSourceCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(locateSourceCode.fulfilled, (state, action) => {
        state.loading = false;
        state.locationResult = action.payload;
      })
      .addCase(locateSourceCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '定位源代码失败';
      })
      
      // 准备AI诊断上下文
      .addCase(prepareAIContext.pending, (state) => {
        state.preparingAI = true;
        state.error = null;
      })
      .addCase(prepareAIContext.fulfilled, (state) => {
        state.preparingAI = false;
      })
      .addCase(prepareAIContext.rejected, (state, action) => {
        state.preparingAI = false;
        state.error = action.error.message || '准备AI诊断上下文失败';
      });
  },
});

export const { clearError, clearLocationResult, setLocationResult } = errorSourceCodeSlice.actions;
export default errorSourceCodeSlice.reducer;