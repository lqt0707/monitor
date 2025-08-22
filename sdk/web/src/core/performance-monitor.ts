/**
 * 性能监控核心模块
 * 负责收集页面加载性能、网络请求性能、用户交互性能等指标
 */

import { PerformanceType, PerformanceData, MonitorConfig, PagePerformanceMetrics, HttpRequestInfo } from '../types';
import { generateId, getTimestamp, generateSessionId, getPageInfo, getUserAgent, isSupported } from '../utils';

/**
 * 性能监控类
 */
export class PerformanceMonitor {
  private config: MonitorConfig;
  private performanceQueue: PerformanceData[] = [];
  private observers: PerformanceObserver[] = [];
  private maxPerformanceRecords: number;
  private navigationStartTime: number;

  constructor(config: MonitorConfig) {
    this.config = config;
    this.maxPerformanceRecords = 200;
    this.navigationStartTime = performance.timeOrigin || Date.now();
    this.init();
  }

  /**
   * 初始化性能监控
   */
  private init(): void {
    if (!this.config.enablePerformanceMonitor || !isSupported('performance')) {
      return;
    }

    this.collectPageLoadMetrics();
    this.setupPerformanceObserver();
    this.setupNavigationObserver();
  }

  /**
   * 收集页面加载性能指标
   */
  private collectPageLoadMetrics(): void {
    // 等待页面加载完成后收集指标
    if (document.readyState === 'complete') {
      this.processPageLoadMetrics();
    } else {
      window.addEventListener('load', () => {
        // 延迟一点时间确保所有指标都已记录
        setTimeout(() => this.processPageLoadMetrics(), 1000);
      });
    }
  }

  /**
   * 处理页面加载性能指标
   */
  private processPageLoadMetrics(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) {
      return;
    }

    const metrics: PagePerformanceMetrics = {
      dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpTime: navigation.connectEnd - navigation.connectStart,
      requestTime: navigation.responseStart - navigation.requestStart,
      responseTime: navigation.responseEnd - navigation.responseStart,
      domParseTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      resourceLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaintTime: 0,
      firstContentfulPaintTime: 0,
      largestContentfulPaintTime: 0,
      firstInputDelay: 0,
      cumulativeLayoutShift: 0
    };

    // 获取绘制时间指标
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        metrics.firstPaintTime = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        metrics.firstContentfulPaintTime = entry.startTime;
      }
    });

    const performanceData: PerformanceData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: this.config.projectId,
      userId: this.config.userId,
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      tags: this.config.tags,
      type: PerformanceType.PAGE_LOAD,
      metrics: metrics as any
    };

    this.addPerformanceData(performanceData);
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObserver(): void {
    if (!isSupported('observer')) {
      return;
    }

    try {
      // 观察LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (lastEntry) {
          this.recordWebVital('LCP', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // 观察FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const fidEntry = entry as any;
          if (fidEntry.processingStart && fidEntry.startTime) {
            const fid = fidEntry.processingStart - fidEntry.startTime;
            this.recordWebVital('FID', fid);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // 观察CLS (Cumulative Layout Shift)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        
        if (clsValue > 0) {
          this.recordWebVital('CLS', clsValue);
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);

    } catch (error) {
      console.warn('Failed to setup performance observer:', error);
    }
  }

  /**
   * 设置导航观察器
   */
  private setupNavigationObserver(): void {
    // 监听页面可见性变化
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        this.flushPerformanceData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 监听页面卸载
    const handleBeforeUnload = () => {
      this.flushPerformanceData();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  /**
   * 记录Web Vitals指标
   * @param name 指标名称
   * @param value 指标值
   */
  private recordWebVital(name: string, value: number): void {
    const performanceData: PerformanceData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: this.config.projectId,
      userId: this.config.userId,
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      tags: this.config.tags,
      type: PerformanceType.USER_INTERACTION,
      metrics: {
        [name]: value
      }
    };

    this.addPerformanceData(performanceData);
  }

  /**
   * 记录HTTP请求性能
   * @param requestInfo 请求信息
   */
  public recordHttpRequest(requestInfo: HttpRequestInfo): void {
    const performanceData: PerformanceData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: this.config.projectId,
      userId: this.config.userId,
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      tags: this.config.tags,
      type: PerformanceType.HTTP_REQUEST,
      metrics: {
        duration: requestInfo.duration,
        status: requestInfo.status,
        requestSize: requestInfo.requestSize || 0,
        responseSize: requestInfo.responseSize || 0
      },
      resource: {
        name: requestInfo.url,
        size: requestInfo.responseSize || 0,
        duration: requestInfo.duration,
        type: 'xhr'
      }
    };

    this.addPerformanceData(performanceData);
  }

  /**
   * 记录资源加载性能
   * @param resource 资源信息
   */
  public recordResourceLoad(resource: PerformanceResourceTiming): void {
    const performanceData: PerformanceData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: this.config.projectId,
      userId: this.config.userId,
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      tags: this.config.tags,
      type: PerformanceType.RESOURCE_LOAD,
      metrics: {
        duration: resource.duration,
        transferSize: resource.transferSize,
        encodedBodySize: resource.encodedBodySize,
        decodedBodySize: resource.decodedBodySize,
        dnsTime: resource.domainLookupEnd - resource.domainLookupStart,
        tcpTime: resource.connectEnd - resource.connectStart,
        requestTime: resource.responseStart - resource.requestStart,
        responseTime: resource.responseEnd - resource.responseStart
      },
      resource: {
        name: resource.name,
        size: resource.transferSize,
        duration: resource.duration,
        type: this.getResourceType(resource.name)
      }
    };

    this.addPerformanceData(performanceData);
  }

  /**
   * 获取资源类型
   * @param url 资源URL
   * @returns 资源类型
   */
  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (!extension) {
      return 'other';
    }

    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'];
    const scriptTypes = ['js', 'jsx', 'ts', 'tsx'];
    const styleTypes = ['css', 'scss', 'sass', 'less'];
    const fontTypes = ['woff', 'woff2', 'ttf', 'otf', 'eot'];

    if (imageTypes.includes(extension)) {
      return 'image';
    } else if (scriptTypes.includes(extension)) {
      return 'script';
    } else if (styleTypes.includes(extension)) {
      return 'stylesheet';
    } else if (fontTypes.includes(extension)) {
      return 'font';
    } else {
      return 'other';
    }
  }

  /**
   * 添加性能数据到队列
   * @param performanceData 性能数据
   */
  private addPerformanceData(performanceData: PerformanceData): void {
    // 检查采样率
    if (this.config.sampleRate && Math.random() > this.config.sampleRate) {
      return;
    }

    this.performanceQueue.push(performanceData);

    // 限制队列大小
    if (this.performanceQueue.length > this.maxPerformanceRecords) {
      this.performanceQueue.shift();
    }

    // 触发性能事件
    this.emitPerformance(performanceData);
  }

  /**
   * 触发性能事件
   * @param performanceData 性能数据
   */
  private emitPerformance(performanceData: PerformanceData): void {
    if (typeof window.CustomEvent !== 'undefined') {
      const event = new CustomEvent('monitor:performance', {
        detail: performanceData
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * 刷新性能数据
   */
  private flushPerformanceData(): void {
    // 这里可以触发数据上报
    if (this.performanceQueue.length > 0) {
      const event = new CustomEvent('monitor:flush', {
        detail: { performance: [...this.performanceQueue] }
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * 获取性能数据队列
   * @returns 性能数据数组
   */
  public getPerformanceData(): PerformanceData[] {
    return [...this.performanceQueue];
  }

  /**
   * 清空性能数据队列
   */
  public clearPerformanceData(): void {
    this.performanceQueue = [];
  }

  /**
   * 销毁性能监控
   */
  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.performanceQueue = [];
  }
}