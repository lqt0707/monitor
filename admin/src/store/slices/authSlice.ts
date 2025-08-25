/**
 * 认证状态管理 Slice
 * 管理用户登录状态和用户信息
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { message } from "antd";
import apiClient from "../../services/api";
import { JWTUtils } from "../../utils/jwt";
import type { User, LoginForm, LoginResponse } from "../../types/monitor";

// 认证状态接口
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// 从 localStorage 获取初始状态
const getInitialState = (): AuthState => {
  const storedUser = localStorage.getItem("user");
  const storedToken = JWTUtils.getStoredToken();

  // 检查 token 是否有效
  const isTokenValid = storedToken
    ? !JWTUtils.isTokenExpired(storedToken)
    : false;

  // 如果 token 无效，清除存储的数据
  if (storedToken && !isTokenValid) {
    localStorage.removeItem("user");
    JWTUtils.removeToken();
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    };
  }

  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken,
    isAuthenticated: !!(storedUser && storedToken && isTokenValid),
    loading: false,
    error: null,
  };
};

// 初始状态
const initialState: AuthState = getInitialState();

/**
 * 异步登录操作
 * @param loginForm 登录表单数据
 * @returns 登录响应
 */
export const loginAsync = createAsyncThunk(
  "auth/login",
  async (loginForm: LoginForm, { rejectWithValue }) => {
    try {
      const response = await apiClient.auth.login(loginForm);
      return response;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "登录失败";
      message.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 异步登出操作
 */
export const logoutAsync = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.auth.logout();
    } catch (error: any) {
      // 即使登出失败，也要清除本地状态
      console.error("Logout error:", error);
    }
  }
);

/**
 * 认证状态 Slice
 */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * 清除错误信息
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * 设置用户信息
     * @param state 当前状态
     * @param action 包含用户信息的 action
     */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },

    /**
     * 清除认证状态
     */
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
  extraReducers: (builder) => {
    builder
      // 登录相关
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        loginAsync.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          state.loading = false;
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
          state.error = null;

          // 保存到本地存储
          localStorage.setItem("user", JSON.stringify(action.payload.user));
          JWTUtils.storeToken(action.payload.token);

          message.success("登录成功");
        }
      )
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // 登出相关
      .addCase(logoutAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;

        // 清除本地存储
        localStorage.removeItem("user");
        JWTUtils.removeToken();

        message.success("已退出登录");
      })
      .addCase(logoutAsync.rejected, (state) => {
        state.loading = false;
        // 即使登出失败，也要清除本地状态
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem("user");
        JWTUtils.removeToken();
      });
  },
});

// 导出 actions
export const { clearError, setUser, clearAuth } = authSlice.actions;

// 导出 reducer
export default authSlice.reducer;
