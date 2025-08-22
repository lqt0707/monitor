/**
 * 应用重写模块
 * JavaScript版本
 */

const { TrackerEvents } = require('./types/index.js');

/**
 * 重写App构造函数
 * @param {Object} monitor Monitor实例
 */
function rewriteApp(monitor) {
  if (!monitor) {
    return;
  }

  // 检查是否为Taro环境
  const isTaroEnv = typeof wx !== 'undefined' && wx.Taro !== undefined;
  
  if (isTaroEnv) {
    rewriteTaroApp(monitor);
  } else {
    rewriteNativeApp(monitor);
  }
}

/**
 * 重写Taro应用
 * @param {Object} monitor Monitor实例
 */
function rewriteTaroApp(monitor) {
  console.log('[RewriteApp] Taro环境下的应用监控需要在应用级别集成');
  
  // 在Taro环境下，监听全局错误
  if (typeof window !== 'undefined') {
    // JavaScript错误监听
    window.addEventListener('error', function(event) {
      const error = {
        message: event.message || 'Unknown error',
        filename: event.filename || '',
        lineno: event.lineno || 0,
        colno: event.colno || 0,
        stack: event.error ? event.error.stack : '',
        timestamp: Date.now()
      };
      
      monitor.processData(TrackerEvents.jsError, error);
    });
    
    // 未处理的Promise拒绝监听
    window.addEventListener('unhandledrejection', function(event) {
      const error = {
        reason: event.reason || 'Unknown rejection',
        promise: event.promise,
        timestamp: Date.now()
      };
      
      monitor.processData(TrackerEvents.unHandleRejection, error);
    });
  }
}

/**
 * 重写原生小程序应用
 * @param {Object} monitor Monitor实例
 */
function rewriteNativeApp(monitor) {
  // 保存原始的App构造函数
  let originalApp;
  
  try {
    if (typeof App !== 'undefined') {
      originalApp = App;
    } else {
      console.warn('[RewriteApp] App constructor not available');
      return;
    }
  } catch (e) {
    console.warn('[RewriteApp] Cannot access App constructor');
    return;
  }

  /**
   * 重写后的App构造函数
   */
  function wrappedApp(appOptions) {
    if (!appOptions || typeof appOptions !== 'object') {
      return originalApp.call(this, appOptions);
    }

    // 包装onLaunch生命周期
    const originalOnLaunch = appOptions.onLaunch;
    appOptions.onLaunch = function(options) {
      // 记录应用启动
      monitor.handleOnLaunch(options || {});
      
      // 调用原始onLaunch
      if (typeof originalOnLaunch === 'function') {
        originalOnLaunch.call(this, options);
      }
    };

    // 包装onShow生命周期
    const originalOnShow = appOptions.onShow;
    appOptions.onShow = function(options) {
      // 记录应用显示
      monitor.pushBehaviorItem({
        type: 'custom',
        method: 'onShow',
        args: options || {},
        time: Date.now()
      });
      
      // 调用原始onShow
      if (typeof originalOnShow === 'function') {
        originalOnShow.call(this, options);
      }
    };

    // 包装onHide生命周期
    const originalOnHide = appOptions.onHide;
    appOptions.onHide = function() {
      // 记录应用隐藏
      monitor.pushBehaviorItem({
        type: 'custom',
        method: 'onHide',
        args: {},
        time: Date.now()
      });
      
      // 调用原始onHide
      if (typeof originalOnHide === 'function') {
        originalOnHide.call(this);
      }
    };

    // 包装onError生命周期
    const originalOnError = appOptions.onError;
    appOptions.onError = function(error) {
      // 记录应用错误
      const errorInfo = {
        message: error || 'Unknown app error',
        timestamp: Date.now()
      };
      
      monitor.processData(TrackerEvents.jsError, errorInfo);
      
      // 调用原始onError
      if (typeof originalOnError === 'function') {
        originalOnError.call(this, error);
      }
    };

    // 调用原始App构造函数
    return originalApp.call(this, appOptions);
  }

  // 替换全局App构造函数
  try {
    if (typeof global !== 'undefined') {
      global.App = wrappedApp;
    } else if (typeof window !== 'undefined') {
      window.App = wrappedApp;
    }
  } catch (e) {
    console.error('[RewriteApp] Failed to rewrite App constructor:', e);
  }
}

// 导出
module.exports = {
  rewriteApp
};