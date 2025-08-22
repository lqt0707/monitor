/**
 * Token 刷新机制
 * 自动检测和刷新即将过期的 JWT token
 */

import { JWTUtils } from './jwt';
import { store } from '../store';
import { clearAuth } from '../store/slices/authSlice';
import { message } from 'antd';
import apiClient from '../services/api';

/**
 * Token 刷新管理器
 */
export class TokenRefreshManager {
  private static instance: TokenRefreshManager;
  private refreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  /**
   * 获取单例实例
   */
  static getInstance(): TokenRefreshManager {
    if (!TokenRefreshManager.instance) {
      TokenRefreshManager.instance = new TokenRefreshManager();
    }
    return TokenRefreshManager.instance;
  }

  /**
   * 启动 token 刷新监控
   */
  startTokenRefresh(): void {
    this.stopTokenRefresh();
    
    // 每分钟检查一次 token 状态
    this.refreshTimer = setInterval(() => {
      this.checkAndRefreshToken();
    }, 60 * 1000);

    // 立即检查一次
    this.checkAndRefreshToken();
  }

  /**
   * 停止 token 刷新监控
   */
  stopTokenRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * 检查并刷新 token
   */
  private async checkAndRefreshToken(): Promise<void> {
    const token = JWTUtils.getStoredToken();
    if (!token) {
      return;
    }

    // 检查 token 是否已过期
    if (JWTUtils.isTokenExpired(token)) {
      console.log('Token 已过期，清除认证状态');
      this.handleTokenExpired();
      return;
    }

    // 检查 token 是否即将过期（5分钟内）
    if (JWTUtils.isTokenExpiringSoon(token, 5)) {
      console.log('Token 即将过期，尝试刷新');
      await this.refreshToken();
    }
  }

  /**
   * 刷新 token
   */
  async refreshToken(): Promise<string | null> {
    // 如果正在刷新，返回现有的 Promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * 执行 token 刷新
   */
  private async performTokenRefresh(): Promise<string | null> {
    try {
      const currentToken = JWTUtils.getStoredToken();
      if (!currentToken) {
        throw new Error('没有可用的 token');
      }

      // 调用刷新 token 的 API（需要在 apiClient 中添加 refreshToken 方法）
      // 临时使用 fetch 实现，后续可以在 apiClient 中添加专门的方法
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ token: currentToken }),
      });

      if (!response.ok) {
        throw new Error('刷新 token 失败');
      }

      const data = await response.json();

       const { token: newToken, user } = data.data;

      // 更新存储的 token 和用户信息
      JWTUtils.storeToken(newToken);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('Token 刷新成功');
      return newToken;
    } catch (error: any) {
      console.error('Token 刷新失败:', error);
      
      // 如果刷新失败，清除认证状态
      this.handleTokenExpired();
      return null;
    }
  }

  /**
   * 处理 token 过期
   */
  private handleTokenExpired(): void {
    // 清除认证状态
    store.dispatch(clearAuth());
    
    // 停止刷新监控
    this.stopTokenRefresh();
    
    // 显示提示信息
    message.warning('登录已过期，请重新登录');
    
    // 重定向到登录页
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * 手动刷新 token
   * 用于在 API 请求失败时主动刷新
   */
  async forceRefreshToken(): Promise<string | null> {
    return this.refreshToken();
  }

  /**
   * 检查当前 token 是否有效
   */
  isTokenValid(): boolean {
    return JWTUtils.isStoredTokenValid();
  }

  /**
   * 获取 token 剩余时间（分钟）
   */
  getTokenRemainingMinutes(): number {
    const token = JWTUtils.getStoredToken();
    if (!token) {
      return 0;
    }
    return Math.floor(JWTUtils.getTokenRemainingTime(token) / 60);
  }
}

// 导出单例实例
export const tokenRefreshManager = TokenRefreshManager.getInstance();

export default tokenRefreshManager;