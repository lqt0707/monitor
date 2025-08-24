/**
 * 性能监控模块
 * JavaScript版本
 */

/**
 * 性能数据结构
 */
const PerformanceData = {
  loadTime: 0,
  renderTime: 0,
  firstPaintTime: 0,
  domReadyTime: 0,
  scriptLoadTime: 0,
  imageLoadTime: 0,
  networkTime: 0,
  timestamp: 0
};

/**
 * 观察页面性能
 * @param {Function} callback 回调函数
 */
function observePagePerformance(callback) {
  try {
    // 获取性能数据
    const performanceData = {
      loadTime: Date.now(),
      renderTime: 0,
      firstPaintTime: 0,
      domReadyTime: 0,
      scriptLoadTime: 0,
      imageLoadTime: 0,
      networkTime: 0,
      timestamp: Date.now()
    };
    
    // 如果有回调函数，则调用
    if (typeof callback === 'function') {
      callback(performanceData);
    }
    
    return performanceData;
  } catch (error) {
    console.error('[Performance] Error observing performance:', error);
    return null;
  }
}

/**
 * 计算页面加载时间
 * @returns {number} 加载时间（毫秒）
 */
function calculateLoadTime() {
  try {
    // 在小程序环境中，可以通过页面生命周期来计算
    return Date.now();
  } catch (error) {
    return 0;
  }
}

/**
 * 获取内存使用情况
 * @returns {Object} 内存信息
 */
function getMemoryUsage() {
  try {
    // 小程序可能不支持内存API，返回默认值
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    };
  } catch (error) {
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0
    };
  }
}

/**
 * 监控FPS
 * @param {Function} callback 回调函数
 */
function monitorFPS(callback) {
  let lastTime = Date.now();
  let frames = 0;
  
  function countFrame() {
    frames++;
    const currentTime = Date.now();
    
    if (currentTime - lastTime >= 1000) {
      const fps = Math.round((frames * 1000) / (currentTime - lastTime));
      
      if (typeof callback === 'function') {
        callback(fps);
      }
      
      frames = 0;
      lastTime = currentTime;
    }
    
    // 在小程序中使用setTimeout模拟requestAnimationFrame
    setTimeout(countFrame, 16);
  }
  
  countFrame();
}

// 导出
module.exports = {
  PerformanceData,
  observePagePerformance,
  calculateLoadTime,
  getMemoryUsage,
  monitorFPS
};