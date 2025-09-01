import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchProjects,
  fetchAssociations,
  uploadSourceCodeAndSourcemap,
  setActiveAssociation,
  deleteAssociation,
  clearError,
} from '../store/slices/sourceCodeSourcemapSlice';
import type { SourceCodeSourcemapAssociation } from '../types/sourceCodeSourcemapIntegration';

interface UseSourceCodeSourcemapReturn {
  // 数据
  projects: Array<{ id: string; name: string; projectId: string }>;
  associations: SourceCodeSourcemapAssociation[];
  
  // 加载状态
  loading: boolean;
  associationsLoading: boolean;
  error: string | null;
  
  // 操作方法
  loadProjects: () => Promise<void>;
  loadAssociations: (projectId: string) => Promise<void>;
  uploadFiles: (formData: FormData) => Promise<boolean>;
  setActive: (projectId: string, associationId: string) => Promise<boolean>;
  removeAssociation: (projectId: string, associationId: string) => Promise<boolean>;
  clearErrorMessage: () => void;
}

export const useSourceCodeSourcemap = (): UseSourceCodeSourcemapReturn => {
  const dispatch = useAppDispatch();
  const { projects, associations, loading, associationsLoading, error } = useAppSelector(
    (state) => state.sourceCodeSourcemap
  );

  // 加载项目列表
  const loadProjects = useCallback(async () => {
    await dispatch(fetchProjects());
  }, [dispatch]);

  // 加载关联信息
  const loadAssociations = useCallback(async (projectId: string) => {
    if (!projectId) return;
    await dispatch(fetchAssociations(projectId));
  }, [dispatch]);

  // 上传文件
  const uploadFiles = useCallback(async (formData: FormData) => {
    try {
      const result = await dispatch(uploadSourceCodeAndSourcemap(formData)).unwrap();
      return result.success;
    } catch (error) {
      console.error('上传失败:', error);
      return false;
    }
  }, [dispatch]);

  // 设置活跃关联
  const setActive = useCallback(async (projectId: string, associationId: string) => {
    try {
      const result = await dispatch(setActiveAssociation({ projectId, associationId })).unwrap();
      // 成功后重新加载关联信息
      await loadAssociations(projectId);
      return result.success;
    } catch (error) {
      console.error('设置活跃失败:', error);
      return false;
    }
  }, [dispatch, loadAssociations]);

  // 删除关联
  const removeAssociation = useCallback(async (projectId: string, associationId: string) => {
    try {
      const result = await dispatch(deleteAssociation({ projectId, associationId })).unwrap();
      // 成功后重新加载关联信息
      await loadAssociations(projectId);
      return result.success;
    } catch (error) {
      console.error('删除失败:', error);
      return false;
    }
  }, [dispatch, loadAssociations]);

  // 清除错误信息
  const clearErrorMessage = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    projects,
    associations,
    loading,
    associationsLoading,
    error,
    loadProjects,
    loadAssociations,
    uploadFiles,
    setActive,
    removeAssociation,
    clearErrorMessage,
  };
};