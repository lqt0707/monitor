/**
 * 插件系统
 * 提供可扩展的插件机制，允许用户自定义监控功能
 */

import { MonitorConfig, MonitorPlugin } from '../types';

/**
 * 插件管理器
 */
export class PluginManager {
  private plugins: Map<string, MonitorPlugin> = new Map();
  private config: MonitorConfig | null = null;
  private isInitialized: boolean = false;

  /**
   * 注册插件
   * @param plugin 插件实例
   */
  public register(plugin: MonitorPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already registered`);
      return;
    }

    this.plugins.set(plugin.name, plugin);

    // 如果已经初始化，立即初始化新插件
    if (this.isInitialized && this.config) {
      try {
        plugin.init(this.config);
      } catch (error) {
        console.error(`Failed to initialize plugin ${plugin.name}:`, error);
      }
    }
  }

  /**
   * 注销插件
   * @param name 插件名称
   */
  public unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      console.warn(`Plugin ${name} is not registered`);
      return;
    }

    try {
      plugin.destroy();
    } catch (error) {
      console.error(`Failed to destroy plugin ${name}:`, error);
    }

    this.plugins.delete(name);
  }

  /**
   * 获取插件
   * @param name 插件名称
   * @returns 插件实例
   */
  public get(name: string): MonitorPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 获取所有插件
   * @returns 插件列表
   */
  public getAll(): MonitorPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 初始化所有插件
   * @param config 配置对象
   */
  public init(config: MonitorConfig): void {
    this.config = config;
    this.isInitialized = true;

    for (const [name, plugin] of this.plugins) {
      try {
        plugin.init(config);
      } catch (error) {
        console.error(`Failed to initialize plugin ${name}:`, error);
      }
    }
  }

  /**
   * 销毁所有插件
   */
  public destroy(): void {
    for (const [name, plugin] of this.plugins) {
      try {
        plugin.destroy();
      } catch (error) {
        console.error(`Failed to destroy plugin ${name}:`, error);
      }
    }

    this.plugins.clear();
    this.config = null;
    this.isInitialized = false;
  }

  /**
   * 检查插件是否已注册
   * @param name 插件名称
   * @returns 是否已注册
   */
  public has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * 获取插件数量
   * @returns 插件数量
   */
  public size(): number {
    return this.plugins.size;
  }
}

/**
 * 基础插件类
 */
export abstract class BasePlugin implements MonitorPlugin {
  public abstract name: string;
  protected config: MonitorConfig | null = null;
  protected isInitialized: boolean = false;

  /**
   * 初始化插件
   * @param config 配置对象
   */
  public init(config: MonitorConfig): void {
    this.config = config;
    this.isInitialized = true;
    this.onInit(config);
  }

  /**
   * 销毁插件
   */
  public destroy(): void {
    if (!this.isInitialized) {
      return;
    }

    this.onDestroy();
    this.config = null;
    this.isInitialized = false;
  }

  /**
   * 插件初始化回调
   * @param config 配置对象
   */
  protected abstract onInit(config: MonitorConfig): void;

  /**
   * 插件销毁回调
   */
  protected abstract onDestroy(): void;

  /**
   * 触发自定义事件
   * @param eventName 事件名称
   * @param data 事件数据
   */
  protected emitEvent(eventName: string, data: any): void {
    try {
      const event = new CustomEvent(eventName, { detail: data });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error emitting event:', error);
    }
  }
}

/**
 * Vue错误插件
 */
class VueErrorPlugin extends BasePlugin {
  public name = 'vue-error';
  private originalErrorHandler: any = null;

  protected onInit(config: MonitorConfig): void {
    if (typeof window === 'undefined') {
      return;
    }

    // 检查Vue是否存在
    const Vue = (window as any).Vue;
    if (!Vue) {
      console.warn('Vue is not found, VueErrorPlugin will not work');
      return;
    }

    // 保存原始错误处理器
    this.originalErrorHandler = Vue.config.errorHandler;

    // 设置Vue错误处理器
    Vue.config.errorHandler = (error: Error, vm: any, info: string) => {
      this.handleVueError(error, vm, info);
      
      // 调用原始错误处理器
      if (this.originalErrorHandler) {
        this.originalErrorHandler(error, vm, info);
      }
    };
  }

  protected onDestroy(): void {
    const Vue = (window as any).Vue;
    if (Vue) {
      Vue.config.errorHandler = this.originalErrorHandler;
    }
  }

  private handleVueError(error: Error, vm: any, info: string): void {
    try {
      const errorData = {
        id: this.generateId(),
        timestamp: Date.now(),
        projectId: this.config?.projectId,
        userId: this.config?.userId,
        sessionId: this.generateSessionId(),
        url: location.href,
        userAgent: navigator.userAgent,
        tags: this.config?.tags,
        type: 'vue_error',
        message: error.message,
        stack: error.stack,
        componentStack: this.getComponentStack(vm),
        info,
        error: {
          name: error.name,
          message: error.message
        }
      };

      this.emitEvent('monitor:error', errorData);
    } catch (err) {
      console.error('Error handling Vue error:', err);
    }
  }

  private getComponentStack(vm: any): string {
    try {
      if (!vm) return '';
      
      const stack: string[] = [];
      let current = vm;
      
      while (current) {
        if (current.$options) {
          const name = current.$options.name || current.$options._componentTag || 'Anonymous';
          stack.push(name);
        }
        current = current.$parent;
      }
      
      return stack.join(' -> ');
    } catch (error) {
      return '';
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}

/**
 * React错误插件
 */
class ReactErrorPlugin extends BasePlugin {
  public name = 'react-error';
  private originalConsoleError: any = null;

  protected onInit(config: MonitorConfig): void {
    if (typeof window === 'undefined') {
      return;
    }

    // 监听React错误边界
    this.setupReactErrorBoundary();
    
    // 监听console.error中的React错误
    this.setupConsoleErrorHandler();
  }

  protected onDestroy(): void {
    if (this.originalConsoleError) {
      console.error = this.originalConsoleError;
    }
  }

  private setupReactErrorBoundary(): void {
    // 这里可以提供一个全局的错误边界组件
    // 实际使用时需要用户在应用中集成
  }

  private setupConsoleErrorHandler(): void {
    this.originalConsoleError = console.error;
    
    console.error = (...args: any[]) => {
      // 检查是否是React错误
      const errorMessage = args[0];
      if (typeof errorMessage === 'string' && this.isReactError(errorMessage)) {
        this.handleReactError(args);
      }
      
      // 调用原始console.error
      this.originalConsoleError.apply(console, args);
    };
  }

  private isReactError(message: string): boolean {
    return message.includes('React') || 
           message.includes('Warning:') ||
           message.includes('Error:');
  }

  private handleReactError(args: any[]): void {
    try {
      const errorData = {
        id: this.generateId(),
        timestamp: Date.now(),
        projectId: this.config?.projectId,
        userId: this.config?.userId,
        sessionId: this.generateSessionId(),
        url: location.href,
        userAgent: navigator.userAgent,
        tags: this.config?.tags,
        type: 'react_error',
        message: args.join(' '),
        stack: new Error().stack,
        error: {
          args
        }
      };

      this.emitEvent('monitor:error', errorData);
    } catch (err) {
      console.error('Error handling React error:', err);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}

// 导出默认插件管理器实例
export const pluginManager = new PluginManager();

// 导出常用插件
export { VueErrorPlugin, ReactErrorPlugin };