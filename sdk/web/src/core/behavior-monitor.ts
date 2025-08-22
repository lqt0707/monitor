/**
 * 行为监控模块
 * 负责收集用户行为数据，包括点击、页面访问、表单提交等
 */

import { MonitorConfig, BehaviorData, BehaviorType } from '../types';
import { generateId, getTimestamp, generateSessionId, debounce, throttle } from '../utils';

/**
 * 行为监控类
 */
export class BehaviorMonitor {
  private config: MonitorConfig;
  private behaviorQueue: BehaviorData[] = [];
  private sessionId: string;
  private isDestroyed: boolean = false;
  private clickHandler: (event: MouseEvent) => void;
  private scrollHandler: () => void;
  private visibilityHandler: () => void;
  private beforeUnloadHandler: () => void;

  constructor(config: MonitorConfig) {
    this.config = config;
    this.sessionId = generateSessionId();
    
    // 绑定事件处理器
    this.clickHandler = this.handleClick.bind(this);
    this.scrollHandler = throttle(this.handleScroll.bind(this), 1000);
    this.visibilityHandler = this.handleVisibilityChange.bind(this);
    this.beforeUnloadHandler = this.handleBeforeUnload.bind(this);
    
    this.init();
  }

  /**
   * 初始化行为监控
   */
  private init(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      this.setupEventListeners();
      this.trackPageView();
    } catch (error) {
      console.error('Failed to initialize BehaviorMonitor:', error);
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 点击事件
    document.addEventListener('click', this.clickHandler, true);
    
    // 滚动事件
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    
    // 页面可见性变化
    document.addEventListener('visibilitychange', this.visibilityHandler);
    
    // 页面卸载
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    
    // 路由变化（SPA应用）
    this.setupRouteChangeListener();
  }

  /**
   * 设置路由变化监听（适用于SPA应用）
   */
  private setupRouteChangeListener(): void {
    // 监听 pushState 和 replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.trackPageView();
    };
    
    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.trackPageView();
    };
    
    // 监听 popstate 事件
    window.addEventListener('popstate', () => {
      this.trackPageView();
    });
  }

  /**
   * 处理点击事件
   * @param event 鼠标事件
   */
  private handleClick(event: MouseEvent): void {
    if (this.isDestroyed) return;

    try {
      const target = event.target as HTMLElement;
      if (!target) return;

      const behaviorData: BehaviorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: this.config.projectId,
        userId: this.config.userId,
        sessionId: this.sessionId,
        url: location.href,
        userAgent: navigator.userAgent,
        tags: this.config.tags,
        type: BehaviorType.CLICK,
        event: 'click',
        data: {
          tagName: target.tagName.toLowerCase(),
          className: target.className,
          id: target.id,
          text: this.getElementText(target),
          xpath: this.getXPath(target),
          position: {
            x: event.clientX,
            y: event.clientY
          }
        }
      };

      this.addBehavior(behaviorData);
    } catch (error) {
      console.error('Error handling click event:', error);
    }
  }

  /**
   * 处理滚动事件
   */
  private handleScroll(): void {
    if (this.isDestroyed) return;

    try {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const scrollPercent = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);

      const behaviorData: BehaviorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: this.config.projectId,
        userId: this.config.userId,
        sessionId: this.sessionId,
        url: location.href,
        userAgent: navigator.userAgent,
        tags: this.config.tags,
        type: BehaviorType.SCROLL,
        event: 'scroll',
        data: {
          scrollTop,
          scrollHeight,
          clientHeight,
          scrollPercent
        }
      };

      this.addBehavior(behaviorData);
    } catch (error) {
      console.error('Error handling scroll event:', error);
    }
  }

  /**
   * 处理页面可见性变化
   */
  private handleVisibilityChange(): void {
    if (this.isDestroyed) return;

    try {
      const isVisible = !document.hidden;
      
      const behaviorData: BehaviorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: this.config.projectId,
        userId: this.config.userId,
        sessionId: this.sessionId,
        url: location.href,
        userAgent: navigator.userAgent,
        tags: this.config.tags,
        type: BehaviorType.PAGE_VIEW,
        event: isVisible ? 'page_show' : 'page_hide',
        data: {
          visible: isVisible,
          visibilityState: document.visibilityState
        }
      };

      this.addBehavior(behaviorData);
    } catch (error) {
      console.error('Error handling visibility change:', error);
    }
  }

  /**
   * 处理页面卸载
   */
  private handleBeforeUnload(): void {
    if (this.isDestroyed) return;

    try {
      const behaviorData: BehaviorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: this.config.projectId,
        userId: this.config.userId,
        sessionId: this.sessionId,
        url: location.href,
        userAgent: navigator.userAgent,
        tags: this.config.tags,
        type: BehaviorType.PAGE_VIEW,
        event: 'page_unload',
        data: {
          duration: getTimestamp() - (performance.timing?.navigationStart || Date.now())
        }
      };

      this.addBehavior(behaviorData);
      this.flushBehaviors();
    } catch (error) {
      console.error('Error handling before unload:', error);
    }
  }

  /**
   * 跟踪页面访问
   */
  public trackPageView(): void {
    if (this.isDestroyed) return;

    try {
      const behaviorData: BehaviorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: this.config.projectId,
        userId: this.config.userId,
        sessionId: this.sessionId,
        url: location.href,
        userAgent: navigator.userAgent,
        tags: this.config.tags,
        type: BehaviorType.PAGE_VIEW,
        event: 'page_view',
        data: {
          title: document.title,
          referrer: document.referrer,
          pathname: location.pathname,
          search: location.search,
          hash: location.hash
        }
      };

      this.addBehavior(behaviorData);
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  /**
   * 跟踪自定义事件
   * @param event 事件名称
   * @param data 事件数据
   */
  public trackCustomEvent(event: string, data?: Record<string, any>): void {
    if (this.isDestroyed) return;

    try {
      const behaviorData: BehaviorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: this.config.projectId,
        userId: this.config.userId,
        sessionId: this.sessionId,
        url: location.href,
        userAgent: navigator.userAgent,
        tags: this.config.tags,
        type: BehaviorType.CUSTOM,
        event,
        data
      };

      this.addBehavior(behaviorData);
    } catch (error) {
      console.error('Error tracking custom event:', error);
    }
  }

  /**
   * 添加行为数据到队列
   * @param behaviorData 行为数据
   */
  private addBehavior(behaviorData: BehaviorData): void {
    if (this.behaviorQueue.length >= (this.config.maxErrors || 100)) {
      this.behaviorQueue.shift(); // 移除最旧的数据
    }

    this.behaviorQueue.push(behaviorData);

    // 触发事件
    this.emitEvent('monitor:behavior', behaviorData);

    // 检查是否需要立即上报
    if (this.behaviorQueue.length >= 10) {
      this.flushBehaviors();
    }
  }

  /**
   * 获取元素文本内容
   * @param element HTML元素
   * @returns 文本内容
   */
  private getElementText(element: HTMLElement): string {
    try {
      if (element.tagName === 'INPUT') {
        const input = element as HTMLInputElement;
        return input.type === 'password' ? '[password]' : input.value || input.placeholder || '';
      }
      
      if (element.tagName === 'TEXTAREA') {
        return (element as HTMLTextAreaElement).value || (element as HTMLTextAreaElement).placeholder || '';
      }
      
      return element.textContent?.trim().substring(0, 100) || '';
    } catch (error) {
      return '';
    }
  }

  /**
   * 获取元素的XPath
   * @param element HTML元素
   * @returns XPath字符串
   */
  private getXPath(element: HTMLElement): string {
    try {
      if (element.id) {
        return `//*[@id="${element.id}"]`;
      }
      
      const parts: string[] = [];
      let current: HTMLElement | null = element;
      
      while (current && current.nodeType === Node.ELEMENT_NODE) {
        let index = 1;
        let sibling = current.previousElementSibling;
        
        while (sibling) {
          if (sibling.tagName === current.tagName) {
            index++;
          }
          sibling = sibling.previousElementSibling;
        }
        
        const tagName = current.tagName.toLowerCase();
        parts.unshift(`${tagName}[${index}]`);
        current = current.parentElement;
      }
      
      return '/' + parts.join('/');
    } catch (error) {
      return '';
    }
  }

  /**
   * 触发自定义事件
   * @param eventName 事件名称
   * @param data 事件数据
   */
  private emitEvent(eventName: string, data: any): void {
    try {
      const event = new CustomEvent(eventName, { detail: data });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error emitting event:', error);
    }
  }

  /**
   * 立即上报行为数据
   */
  private flushBehaviors(): void {
    if (this.behaviorQueue.length === 0) return;

    try {
      const behaviors = [...this.behaviorQueue];
      this.behaviorQueue = [];
      
      this.emitEvent('monitor:flush', { behaviors });
    } catch (error) {
      console.error('Error flushing behaviors:', error);
    }
  }

  /**
   * 获取行为数据
   * @returns 行为数据数组
   */
  public getBehaviors(): BehaviorData[] {
    return [...this.behaviorQueue];
  }

  /**
   * 清空行为数据
   */
  public clearBehaviors(): void {
    this.behaviorQueue = [];
  }

  /**
   * 销毁行为监控
   */
  public destroy(): void {
    if (this.isDestroyed) return;

    try {
      // 上报剩余数据
      this.flushBehaviors();

      // 移除事件监听器
      document.removeEventListener('click', this.clickHandler, true);
      window.removeEventListener('scroll', this.scrollHandler);
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);

      // 恢复原始方法
      if (typeof history.pushState === 'function') {
        // 这里简化处理，实际项目中可能需要更复杂的恢复逻辑
      }

      this.isDestroyed = true;
      this.behaviorQueue = [];
    } catch (error) {
      console.error('Error destroying BehaviorMonitor:', error);
    }
  }
}