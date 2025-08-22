/**
 * TypeScript类型声明文件
 * 解决example项目中的类型错误
 */

// 扩展Window接口，添加自定义属性
declare global {
  interface Window {
    // Monitor SDK实例
    monitorSDK: any;

    // 错误监控演示函数
    triggerJSError: () => void;
    triggerPromiseError: () => void;
    triggerResourceError: () => void;
    triggerCustomError: () => void;

    // 性能监控演示函数
    simulateSlowOperation: () => void;
    simulateMemoryLeak: () => void;
    measureCustomPerformance: () => void;

    // 用户行为跟踪演示函数
    trackButtonClick: () => void;
    trackPageView: () => void;
    trackCustomEvent: () => void;
    setUserId: () => void;

    // 工具函数
    clearStatus: () => void;
    monitorExample: {
      getStatus: () => any;
      flush: () => void;
    };

    // 内存泄漏演示用的数组
    leakedArray?: any[];
  }

  // 扩展Performance接口，添加memory属性
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }

  // 扩展HTMLElement接口，添加value属性（用于input元素）
  interface HTMLElement {
    value?: string;
  }

  // 声明未定义的变量（用于演示错误）
  var undefinedVariable: any;
}

export {};
