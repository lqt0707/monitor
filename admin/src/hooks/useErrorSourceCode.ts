import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  locateSourceCode,
  prepareAIContext,
  clearError,
  clearLocationResult,
  setLocationResult,
} from '../store/slices/errorSourceCodeSlice';
import type { SourceCodeLocationResult } from '../types/sourceCodeSourcemapIntegration';

interface ErrorInfo {
  projectId: string;
  version: string;
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  errorMessage: string;
  stackTrace?: string;
}

interface UseErrorSourceCodeReturn {
  // 数据
  locationResult: SourceCodeLocationResult | null;
  
  // 状态
  loading: boolean;
  preparingAI: boolean;
  error: string | null;
  
  // 操作方法
  locate: (errorInfo: ErrorInfo) => Promise<SourceCodeLocationResult | null>;
  prepareAI: (errorInfo: ErrorInfo, contextSize?: number) => Promise<boolean>;
  clearErrorMessage: () => void;
  clearResult: () => void;
}

export const useErrorSourceCode = (): UseErrorSourceCodeReturn => {
  const dispatch = useAppDispatch();
  const { locationResult, loading, preparingAI, error } = useAppSelector(
    (state) => state.errorSourceCode
  );

  // 定位源代码
  const locate = useCallback(async (errorInfo: ErrorInfo) => {
    try {
      const result = await dispatch(locateSourceCode(errorInfo)).unwrap();
      return result;
    } catch (error) {
      console.error('定位源代码失败:', error);
      return null;
    }
  }, [dispatch]);

  // 准备AI诊断上下文
  const prepareAI = useCallback(async (errorInfo: ErrorInfo, contextSize: number = 10) => {
    try {
      const result = await dispatch(prepareAIContext({ errorInfo, contextSize })).unwrap();
      return result.success;
    } catch (error) {
      console.error('准备AI诊断上下文失败:', error);
      return false;
    }
  }, [dispatch]);

  // 清除错误信息
  const clearErrorMessage = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // 清除定位结果
  const clearResult = useCallback(() => {
    dispatch(clearLocationResult());
  }, [dispatch]);

  return {
    locationResult,
    loading,
    preparingAI,
    error,
    locate,
    prepareAI,
    clearErrorMessage,
    clearResult,
  };
};