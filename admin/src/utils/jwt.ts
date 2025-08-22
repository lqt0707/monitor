/**
 * JWT 工具类
 * 用于处理 JWT token 的解析、验证和管理
 */

/**
 * JWT 载荷接口
 */
interface JWTPayload {
  /** 用户ID */
  userId: string;
  /** 用户名 */
  username: string;
  /** 用户角色 */
  role: 'admin' | 'user';
  /** 签发时间 */
  iat: number;
  /** 过期时间 */
  exp: number;
}

/**
 * JWT 工具类
 */
export class JWTUtils {
  /**
   * 解析 JWT token
   * @param token JWT token
   * @returns 解析后的载荷或 null
   */
  static parseToken(token: string): JWTPayload | null {
    try {
      // JWT 由三部分组成：header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      // 解码 payload（Base64URL）
      const payload = parts[1];
      const decodedPayload = this.base64UrlDecode(payload);
      
      return JSON.parse(decodedPayload) as JWTPayload;
    } catch (error) {
      console.error('解析 JWT token 失败:', error);
      return null;
    }
  }

  /**
   * 检查 token 是否过期
   * @param token JWT token
   * @returns 是否过期
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.parseToken(token);
    if (!payload) {
      return true;
    }

    // 检查过期时间（exp 是秒级时间戳）
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  /**
   * 获取 token 剩余有效时间（秒）
   * @param token JWT token
   * @returns 剩余时间（秒），如果已过期或无效则返回 0
   */
  static getTokenRemainingTime(token: string): number {
    const payload = this.parseToken(token);
    if (!payload) {
      return 0;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = payload.exp - currentTime;
    return Math.max(0, remainingTime);
  }

  /**
   * 从 token 中获取用户信息
   * @param token JWT token
   * @returns 用户信息或 null
   */
  static getUserFromToken(token: string): { userId: string; username: string; role: 'admin' | 'user' } | null {
    const payload = this.parseToken(token);
    if (!payload) {
      return null;
    }

    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };
  }

  /**
   * 检查 token 是否即将过期（默认 5 分钟内）
   * @param token JWT token
   * @param thresholdMinutes 阈值（分钟）
   * @returns 是否即将过期
   */
  static isTokenExpiringSoon(token: string, thresholdMinutes: number = 5): boolean {
    const remainingTime = this.getTokenRemainingTime(token);
    const thresholdSeconds = thresholdMinutes * 60;
    return remainingTime > 0 && remainingTime <= thresholdSeconds;
  }

  /**
   * Base64URL 解码
   * @param str Base64URL 编码的字符串
   * @returns 解码后的字符串
   */
  private static base64UrlDecode(str: string): string {
    // Base64URL 转 Base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    
    // 补齐 padding
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }

    // 解码
    return atob(base64);
  }

  /**
   * 从 localStorage 获取 token
   * @returns token 或 null
   */
  static getStoredToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * 将 token 存储到 localStorage
   * @param token JWT token
   */
  static storeToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * 从 localStorage 移除 token
   */
  static removeToken(): void {
    localStorage.removeItem('token');
  }

  /**
   * 检查存储的 token 是否有效
   * @returns 是否有效
   */
  static isStoredTokenValid(): boolean {
    const token = this.getStoredToken();
    if (!token) {
      return false;
    }
    return !this.isTokenExpired(token);
  }
}

export default JWTUtils;