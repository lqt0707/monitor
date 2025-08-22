/**
 * Redux Store 配置
 * 管理应用全局状态
 */

import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import errorSlice from './slices/errorSlice';
import projectSlice from './slices/projectSlice';

/**
 * 配置 Redux Store
 */
export const store = configureStore({
  reducer: {
    auth: authSlice,
    error: errorSlice,
    project: projectSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

// 导出类型定义
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;