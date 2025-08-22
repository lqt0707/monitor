/**
 * 页面重写模块
 * JavaScript版本
 */

const { TrackerEvents, IBehaviorItemType } = require('./types/index.js');

/**
 * 重写Page构造函数
 * @param {Object} monitor Monitor实例
 */
function rewritePage(monitor) {
  if (!monitor) {
    return;
  }

  // 检查是否为Taro环境
  let isTaroEnv = false;
  try {
    isTaroEnv = typeof wx !== 'undefined' && wx.Taro !== undefined;
  } catch (e) {
    // 忽略错误，使用默认值
  }
  
  if (isTaroEnv) {
    rewriteTaroPage(monitor);
  } else {
    rewriteNativePage(monitor);
  }
}

/**
 * 重写Taro页面
 * @param {Object} monitor Monitor实例
 */
function rewriteTaroPage(monitor) {
  console.log('[RewritePage] Taro环境下的页面监控需要在页面级别集成');
}

/**
 * 重写原生小程序页面
 * @param {Object} monitor Monitor实例
 */
function rewriteNativePage(monitor) {
  // 保存原始的Page构造函数
  let originalPage;
  
  try {
    if (typeof Page !== 'undefined') {
      originalPage = Page;
    } else {
      console.warn('[RewritePage] Page constructor not available');
      return;
    }
  } catch (e) {
    console.warn('[RewritePage] Cannot access Page constructor');
    return;
  }

  /**
   * 重写后的Page构造函数
   */
  function wrappedPage(pageOptions) {
    if (!pageOptions || typeof pageOptions !== 'object') {
      return originalPage.call(this, pageOptions);
    }

    // 包装onLoad生命周期
    const originalOnLoad = pageOptions.onLoad;
    pageOptions.onLoad = function(options) {
      const startTime = Date.now();
      
      // 记录页面加载开始
      monitor.pushBehaviorItem({
        type: IBehaviorItemType.route,
        method: 'onLoad',
        args: options || {},
        time: startTime
      });
      
      // 调用原始onLoad
      if (typeof originalOnLoad === 'function') {
        originalOnLoad.call(this, options);
      }
      
      // 记录页面加载完成
      const endTime = Date.now();
      monitor.pushBehaviorItem({
        type: IBehaviorItemType.route,
        method: 'onLoadComplete',
        args: options || {},
        timeConsume: endTime - startTime,
        time: endTime
      });
    };

    // 包装onShow生命周期
    const originalOnShow = pageOptions.onShow;
    pageOptions.onShow = function() {
      // 记录页面显示
      monitor.pushBehaviorItem({
        type: IBehaviorItemType.route,
        method: 'onShow',
        args: {},
        time: Date.now()
      });
      
      // 开始性能监控
      monitor.observePagePerformance();
      
      // 调用原始onShow
      if (typeof originalOnShow === 'function') {
        originalOnShow.call(this);
      }
    };

    // 包装onHide生命周期
    const originalOnHide = pageOptions.onHide;
    pageOptions.onHide = function() {
      // 记录页面隐藏
      monitor.pushBehaviorItem({
        type: IBehaviorItemType.route,
        method: 'onHide',
        args: {},
        time: Date.now()
      });
      
      // 调用原始onHide
      if (typeof originalOnHide === 'function') {
        originalOnHide.call(this);
      }
    };

    // 包装onUnload生命周期
    const originalOnUnload = pageOptions.onUnload;
    pageOptions.onUnload = function() {
      // 记录页面卸载
      monitor.pushBehaviorItem({
        type: IBehaviorItemType.route,
        method: 'onUnload',
        args: {},
        time: Date.now()
      });
      
      // 调用原始onUnload
      if (typeof originalOnUnload === 'function') {
        originalOnUnload.call(this);
      }
    };

    // 包装onReady生命周期
    const originalOnReady = pageOptions.onReady;
    pageOptions.onReady = function() {
      // 记录页面准备就绪
      monitor.pushBehaviorItem({
        type: IBehaviorItemType.route,
        method: 'onReady',
        args: {},
        time: Date.now()
      });
      
      // 调用原始onReady
      if (typeof originalOnReady === 'function') {
        originalOnReady.call(this);
      }
    };

    // 包装页面事件处理函数
    Object.keys(pageOptions).forEach(key => {
      const value = pageOptions[key];
      if (typeof value === 'function' && !key.startsWith('on') && key !== 'data') {
        pageOptions[key] = function(...args) {
          // 记录用户行为
          monitor.pushBehaviorItem({
            type: IBehaviorItemType.click,
            method: key,
            args: args,
            time: Date.now()
          });
          
          // 调用原始函数
          return value.apply(this, args);
        };
      }
    });

    // 调用原始Page构造函数
    return originalPage.call(this, pageOptions);
  }

  // 替换全局Page构造函数
  try {
    if (typeof global !== 'undefined') {
      global.Page = wrappedPage;
    } else if (typeof window !== 'undefined') {
      window.Page = wrappedPage;
    }
  } catch (e) {
    console.error('[RewritePage] Failed to rewrite Page constructor:', e);
  }
}

// 导出
module.exports = {
  rewritePage
};