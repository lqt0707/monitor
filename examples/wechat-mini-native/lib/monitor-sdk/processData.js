/**
 * 数据处理模块
 * JavaScript版本
 */

/**
 * 创建数据处理工厂
 * @param {Object} monitor Monitor实例
 * @returns {Function} 数据处理函数
 */
function processDataFactory(monitor) {
  /**
   * 处理数据
   * @param {string} eventName 事件名
   * @param {any} data 数据
   */
  return function processData(eventName, data) {
    try {
      // 构建完整的监控数据
      const processedData = {
        eventName: eventName,
        data: data,
        timestamp: Date.now(),
        env: monitor.$options.env,
        scene: monitor.scene,
        systemInfo: monitor.systemInfo,
        network: monitor.network,
        performanceData: monitor.performanceData,
        customData: monitor.customData,
        behavior: monitor.behavior.slice(), // 复制行为数组
        activePage: monitor.activePage
      };
      
      // 触发事件
      monitor.emit(eventName, processedData);
      
    } catch (error) {
      console.error('[ProcessData] Error processing data:', error);
    }
  };
}

// 导出
module.exports = {
  processDataFactory
};