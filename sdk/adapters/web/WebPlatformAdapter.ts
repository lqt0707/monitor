/**
 * Web平台适配器实现
 * 实现Web环境下的监控功能适配
 */

import {
  PlatformAdapter,
  PlatformInfo,
  ErrorCaptureAdapter,
  PerformanceAdapter,
  BehaviorAdapter,
  NetworkAdapter,
  StorageAdapter,
  HttpRequestInfo,
} from "../../core/interfaces/PlatformAdapter";
import {
  ErrorData,
  PerformanceData,
  BehaviorData,
  ErrorType,
  PerformanceType,
  BehaviorType,
} from "../../core/types/base";
import {
  generateId,
  getTimestamp,
  generateSessionId,
  getPageInfo,
  getUserAgent,
  serializeError,
  getErrorStack,
} from "../../core/utils/common";

/**
 * Web错误捕获适配器
 */
class WebErrorCapture implements ErrorCaptureAdapter {
  private listeners: Array<() => void> = [];
  private config: any;

  initErrorListeners(onError: (error: ErrorData) => void): void {
    this.setupGlobalErrorHandler(onError);
    this.setupUnhandledRejectionHandler(onError);
    this.setupResourceErrorHandler(onError);
  }

  private setupGlobalErrorHandler(onError: (error: ErrorData) => void): void {
    const handler = (event: ErrorEvent) => {
      const errorData: ErrorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: "",
        sessionId: generateSessionId(),
        url: getPageInfo().url,
        userAgent: getUserAgent(),
        platform: "web",
        type: ErrorType.JS_ERROR,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error ? getErrorStack(event.error) : undefined,
        error: serializeError(event.error),
      };
      onError(errorData);
    };

    window.addEventListener("error", handler);
    this.listeners.push(() => window.removeEventListener("error", handler));
  }

  private setupUnhandledRejectionHandler(
    onError: (error: ErrorData) => void
  ): void {
    const handler = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const errorData: ErrorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: "",
        sessionId: generateSessionId(),
        url: getPageInfo().url,
        userAgent: getUserAgent(),
        platform: "web",
        type: ErrorType.PROMISE_ERROR,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? getErrorStack(error) : undefined,
        error: serializeError(error),
      };
      onError(errorData);
    };

    window.addEventListener("unhandledrejection", handler);
    this.listeners.push(() =>
      window.removeEventListener("unhandledrejection", handler)
    );
  }

  private setupResourceErrorHandler(onError: (error: ErrorData) => void): void {
    const handler = (event: Event) => {
      const target = event.target;
      if (!target || target === window || !(target instanceof HTMLElement)) {
        return;
      }

      const tagName = target.tagName?.toLowerCase();
      const resourceUrl = (target as any).src || (target as any).href;

      if (!resourceUrl) return;

      const errorData: ErrorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: "",
        sessionId: generateSessionId(),
        url: getPageInfo().url,
        userAgent: getUserAgent(),
        platform: "web",
        type: ErrorType.RESOURCE_ERROR,
        message: `Failed to load ${tagName}: ${resourceUrl}`,
        filename: resourceUrl,
        error: {
          tagName,
          resourceUrl,
          outerHTML: target.outerHTML?.substring(0, 200),
        },
      };
      onError(errorData);
    };

    window.addEventListener("error", handler, true);
    this.listeners.push(() =>
      window.removeEventListener("error", handler, true)
    );
  }

  destroyErrorListeners(): void {
    this.listeners.forEach((cleanup) => cleanup());
    this.listeners = [];
  }

  captureError(error: Error | string, extra?: Record<string, any>): ErrorData {
    return {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: "",
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      platform: "web",
      type: ErrorType.CUSTOM_ERROR,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? getErrorStack(error) : undefined,
      error: serializeError(error),
      ...extra,
    };
  }

  captureHttpError(request: HttpRequestInfo): ErrorData {
    return {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: "",
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      platform: "web",
      type: ErrorType.HTTP_ERROR,
      message: `HTTP ${request.status} ${request.statusText}: ${request.method} ${request.url}`,
      error: {
        url: request.url,
        method: request.method,
        status: request.status,
        statusText: request.statusText,
        duration: request.duration,
      },
    };
  }
}

/**
 * Web性能监控适配器
 */
class WebPerformanceAdapter implements PerformanceAdapter {
  private observer?: PerformanceObserver;
  private onPerformance?: (data: PerformanceData) => void;

  initPerformanceMonitor(onPerformance: (data: PerformanceData) => void): void {
    this.onPerformance = onPerformance;
    this.setupNavigationTiming();
    this.setupResourceTiming();
    this.setupUserTiming();
  }

  private setupNavigationTiming(): void {
    if (typeof performance === "undefined") return;

    // 页面加载完成后收集导航时间
    if (document.readyState === "complete") {
      this.collectNavigationTiming();
    } else {
      window.addEventListener("load", () => {
        setTimeout(() => this.collectNavigationTiming(), 0);
      });
    }
  }

  private collectNavigationTiming(): void {
    if (!performance.timing) return;

    const timing = performance.timing;
    const metrics = {
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
      tcpTime: timing.connectEnd - timing.connectStart,
      requestTime: timing.responseStart - timing.requestStart,
      responseTime: timing.responseEnd - timing.responseStart,
      domParseTime: timing.domContentLoadedEventStart - timing.domLoading,
      resourceLoadTime:
        timing.loadEventStart - timing.domContentLoadedEventStart,
      totalTime: timing.loadEventEnd - timing.navigationStart,
    };

    const performanceData: PerformanceData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: "",
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      platform: "web",
      type: PerformanceType.PAGE_LOAD,
      metrics,
    };

    this.onPerformance?.(performanceData);
  }

  private setupResourceTiming(): void {
    if (!performance.getEntriesByType) return;

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "resource") {
          this.handleResourceEntry(entry as PerformanceResourceTiming);
        }
      }
    });

    this.observer.observe({ entryTypes: ["resource"] });
  }

  private handleResourceEntry(entry: PerformanceResourceTiming): void {
    const performanceData: PerformanceData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: "",
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      platform: "web",
      type: PerformanceType.RESOURCE_LOAD,
      metrics: {
        duration: entry.duration,
        size: entry.transferSize || 0,
        dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
        tcpTime: entry.connectEnd - entry.connectStart,
        requestTime: entry.responseStart - entry.requestStart,
        responseTime: entry.responseEnd - entry.responseStart,
      },
      resource: {
        name: entry.name,
        size: entry.transferSize || 0,
        duration: entry.duration,
        type: this.getResourceType(entry.name),
      },
    };

    this.onPerformance?.(performanceData);
  }

  private getResourceType(url: string): string {
    const extension = url.split(".").pop()?.toLowerCase();
    if (!extension) return "other";

    if (["js", "jsx", "ts", "tsx"].includes(extension)) return "script";
    if (["css", "scss", "sass", "less"].includes(extension))
      return "stylesheet";
    if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(extension))
      return "image";
    if (["woff", "woff2", "ttf", "otf", "eot"].includes(extension))
      return "font";
    return "other";
  }

  private setupUserTiming(): void {
    // 监听自定义性能标记
    if (!performance.getEntriesByType) return;

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "measure") {
          this.handleMeasureEntry(entry as PerformanceMeasure);
        }
      }
    });

    this.observer.observe({ entryTypes: ["measure"] });
  }

  private handleMeasureEntry(entry: PerformanceMeasure): void {
    const performanceData: PerformanceData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: "",
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      platform: "web",
      type: PerformanceType.USER_INTERACTION,
      metrics: {
        duration: entry.duration,
        startTime: entry.startTime,
      },
    };

    this.onPerformance?.(performanceData);
  }

  destroyPerformanceMonitor(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }

  recordPerformance(
    name: string,
    metrics: Record<string, number>
  ): PerformanceData {
    return {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: "",
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      platform: "web",
      type: PerformanceType.CUSTOM_METRIC,
      metrics,
    };
  }

  getPagePerformance(): Record<string, number> {
    if (!performance.timing) return {};

    const timing = performance.timing;
    return {
      dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
      tcpTime: timing.connectEnd - timing.connectStart,
      requestTime: timing.responseStart - timing.requestStart,
      responseTime: timing.responseEnd - timing.responseStart,
      domParseTime: timing.domContentLoadedEventStart - timing.domLoading,
      totalTime: timing.loadEventEnd - timing.navigationStart,
    };
  }
}

/**
 * Web行为监控适配器
 */
class WebBehaviorAdapter implements BehaviorAdapter {
  private listeners: Array<() => void> = [];
  private onBehavior?: (data: BehaviorData) => void;

  initBehaviorMonitor(onBehavior: (data: BehaviorData) => void): void {
    this.onBehavior = onBehavior;
    this.setupClickTracking();
    this.setupPageViewTracking();
    this.setupScrollTracking();
  }

  private setupClickTracking(): void {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const behaviorData: BehaviorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: "",
        sessionId: generateSessionId(),
        url: getPageInfo().url,
        userAgent: getUserAgent(),
        platform: "web",
        type: BehaviorType.CLICK,
        event: "click",
        target: this.getElementSelector(target),
        xpath: this.getElementXPath(target),
        data: {
          x: event.clientX,
          y: event.clientY,
          tagName: target.tagName,
          className: target.className,
          id: target.id,
          text: target.textContent?.substring(0, 100),
        },
      };
      this.onBehavior?.(behaviorData);
    };

    document.addEventListener("click", handler, true);
    this.listeners.push(() =>
      document.removeEventListener("click", handler, true)
    );
  }

  private setupPageViewTracking(): void {
    // 记录初始页面访问
    this.recordPageView();

    // 监听历史记录变化（SPA路由）
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      setTimeout(() => this.recordPageView(), 0);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      setTimeout(() => this.recordPageView(), 0);
    };

    const popstateHandler = () => {
      setTimeout(() => this.recordPageView(), 0);
    };

    window.addEventListener("popstate", popstateHandler);
    this.listeners.push(() => {
      window.removeEventListener("popstate", popstateHandler);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    });
  }

  private recordPageView(): void {
    const pageInfo = getPageInfo();
    const behaviorData: BehaviorData = {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: "",
      sessionId: generateSessionId(),
      url: pageInfo.url,
      userAgent: getUserAgent(),
      platform: "web",
      type: BehaviorType.PAGE_VIEW,
      event: "page_view",
      data: {
        title: pageInfo.title,
        referrer: pageInfo.referrer,
      },
    };
    this.onBehavior?.(behaviorData);
  }

  private setupScrollTracking(): void {
    let lastScrollTime = 0;
    const throttleDelay = 1000; // 1秒内最多记录一次滚动

    const handler = () => {
      const now = Date.now();
      if (now - lastScrollTime < throttleDelay) return;
      lastScrollTime = now;

      const behaviorData: BehaviorData = {
        id: generateId(),
        timestamp: getTimestamp(),
        projectId: "",
        sessionId: generateSessionId(),
        url: getPageInfo().url,
        userAgent: getUserAgent(),
        platform: "web",
        type: BehaviorType.SCROLL,
        event: "scroll",
        data: {
          scrollTop: window.pageYOffset || document.documentElement.scrollTop,
          scrollLeft: window.pageXOffset || document.documentElement.scrollLeft,
          scrollHeight: document.documentElement.scrollHeight,
          clientHeight: document.documentElement.clientHeight,
        },
      };
      this.onBehavior?.(behaviorData);
    };

    window.addEventListener("scroll", handler, { passive: true });
    this.listeners.push(() => window.removeEventListener("scroll", handler));
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.className) {
      const classes = element.className
        .split(" ")
        .filter((c) => c)
        .join(".");
      if (classes) {
        return `${element.tagName.toLowerCase()}.${classes}`;
      }
    }

    return element.tagName.toLowerCase();
  }

  private getElementXPath(element: HTMLElement): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const parts = [];
    let current: HTMLElement | null = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 1;
      let sibling = current.previousSibling;

      while (sibling) {
        if (
          sibling.nodeType === Node.ELEMENT_NODE &&
          sibling.nodeName === current.nodeName
        ) {
          index++;
        }
        sibling = sibling.previousSibling;
      }

      parts.unshift(`${current.nodeName.toLowerCase()}[${index}]`);
      current = current.parentElement;
    }

    return "/" + parts.join("/");
  }

  destroyBehaviorMonitor(): void {
    this.listeners.forEach((cleanup) => cleanup());
    this.listeners = [];
  }

  recordBehavior(event: string, data?: Record<string, any>): BehaviorData {
    return {
      id: generateId(),
      timestamp: getTimestamp(),
      projectId: "",
      sessionId: generateSessionId(),
      url: getPageInfo().url,
      userAgent: getUserAgent(),
      platform: "web",
      type: BehaviorType.CUSTOM,
      event,
      data,
    };
  }
}

/**
 * Web网络适配器
 */
class WebNetworkAdapter implements NetworkAdapter {
  interceptNetwork(
    onRequest: (request: any) => void,
    onResponse: (response: any) => void,
    onError: (error: any) => void
  ): void {
    // 拦截XMLHttpRequest
    this.interceptXHR(onRequest, onResponse, onError);
    // 拦截fetch
    this.interceptFetch(onRequest, onResponse, onError);
  }

  private interceptXHR(
    onRequest: (request: any) => void,
    onResponse: (response: any) => void,
    onError: (error: any) => void
  ): void {
    const originalXHR = window.XMLHttpRequest;
    const self = this;

    (window as any).XMLHttpRequest = function () {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;

      let requestData: any = {
        method: "",
        url: "",
        startTime: 0,
        headers: {},
      };

      xhr.open = function (
        method: string,
        url: string,
        async: boolean = true,
        username?: string | null,
        password?: string | null
      ) {
        requestData.method = method;
        requestData.url = url;
        requestData.startTime = Date.now();
        return originalOpen.call(this, method, url, async, username, password);
      };

      xhr.send = function (data: any) {
        onRequest(requestData);

        const handleResponse = () => {
          const responseData = {
            ...requestData,
            status: xhr.status,
            statusText: xhr.statusText,
            duration: Date.now() - requestData.startTime,
            responseSize: xhr.responseText?.length || 0,
          };

          if (xhr.status >= 400) {
            onError(responseData);
          } else {
            onResponse(responseData);
          }
        };

        xhr.addEventListener("load", handleResponse);
        xhr.addEventListener("error", () => onError(requestData));
        xhr.addEventListener("timeout", () =>
          onError({ ...requestData, error: "timeout" })
        );

        return originalSend.apply(this, [data]);
      };

      return xhr;
    };
  }

  private interceptFetch(
    onRequest: (request: any) => void,
    onResponse: (response: any) => void,
    onError: (error: any) => void
  ): void {
    const originalFetch = window.fetch;

    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ) {
      const startTime = Date.now();
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method || "GET";

      const requestData = {
        url,
        method,
        startTime,
        headers: init?.headers || {},
      };

      onRequest(requestData);

      try {
        const response = await originalFetch(input, init);
        const responseData = {
          ...requestData,
          status: response.status,
          statusText: response.statusText,
          duration: Date.now() - startTime,
        };

        if (response.status >= 400) {
          onError(responseData);
        } else {
          onResponse(responseData);
        }

        return response;
      } catch (error) {
        onError({
          ...requestData,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    };
  }

  async sendData(url: string, data: any, options?: any): Promise<any> {
    const requestOptions: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: JSON.stringify(data),
    };

    if (options?.timeout) {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), options.timeout);
      requestOptions.signal = controller.signal;
    }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * Web存储适配器
 */
class WebStorageAdapter implements StorageAdapter {
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn("[Monitor] localStorage not available:", error);
    }
  }

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("[Monitor] localStorage not available:", error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn("[Monitor] localStorage not available:", error);
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn("[Monitor] localStorage not available:", error);
    }
  }
}

/**
 * Web平台适配器
 */
export class WebPlatformAdapter implements PlatformAdapter {
  readonly platformInfo: PlatformInfo;
  readonly errorCapture: ErrorCaptureAdapter;
  readonly performance: PerformanceAdapter;
  readonly behavior: BehaviorAdapter;
  readonly network: NetworkAdapter;
  readonly storage: StorageAdapter;

  constructor() {
    this.platformInfo = {
      platform: "web",
      version: "1.0.0",
      userAgent: getUserAgent(),
      deviceInfo: {
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth,
        },
      },
    };

    this.errorCapture = new WebErrorCapture();
    this.performance = new WebPerformanceAdapter();
    this.behavior = new WebBehaviorAdapter();
    this.network = new WebNetworkAdapter();
    this.storage = new WebStorageAdapter();
  }

  init(config: Record<string, any>): void {
    console.log("[WebPlatformAdapter] Initialized with config:", config);
  }

  destroy(): void {
    this.errorCapture.destroyErrorListeners();
    this.performance.destroyPerformanceMonitor();
    this.behavior.destroyBehaviorMonitor();
    console.log("[WebPlatformAdapter] Destroyed");
  }
}
