/**
 * 数据上报模块
 * 负责将监控数据上报到服务端
 */

/* global wx */

/**
 * 数据上报器类
 */
class Reporter {
  constructor(options = {}) {
    this.serverUrl = options.url || options.serverUrl || 'http://localhost:3001';
    this.projectId = options.projectId || 'taro-wechat-mini';
    this.apiKey = options.apiKey || '';
    this.timeout = options.timeout || 10000;
    this.retryTimes = options.retryTimes || 3;
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 5000;
    
    // 数据队列
    this.dataQueue = [];
    this.isReporting = false;
    
    // 启动定时上报
    this.startBatchReporting();
  }

  /**
   * 添加数据到上报队列
   * @param {string} eventName 事件名称
   * @param {Object} data 事件数据
   */
  addData(eventName, data) {
    try {
      const reportData = this.formatReportData(eventName, data);
      this.dataQueue.push(reportData);
      
      // 如果队列满了，立即上报
      if (this.dataQueue.length >= this.batchSize) {
        this.flushData();
      }
    } catch (error) {
      console.error('[Reporter] Error adding data:', error);
    }
  }

  /**
   * 格式化上报数据
   * @param {string} eventName 事件名称
   * @param {Object} data 事件数据
   * @returns {Object} 格式化后的数据
   */
  formatReportData(eventName, data) {
    const reportData = {
      projectId: this.projectId,
      type: eventName
    };

    // 根据事件类型格式化数据
    switch (eventName) {
      case 'jsError':
        reportData.errorMessage = data.data?.message || data.data?.error?.message || 'Unknown error';
        reportData.errorStack = data.data?.stack || data.data?.error?.stack || '';
        reportData.pageUrl = data.activePage || data.data?.pageUrl || '';
        reportData.userId = data.customData?.userId || '';
        reportData.userAgent = data.systemInfo?.system || '';
        reportData.deviceInfo = JSON.stringify(data.systemInfo || {});
        reportData.networkInfo = JSON.stringify(data.network || {});
        reportData.extraData = JSON.stringify({
          scene: data.scene,
          behavior: data.behavior?.slice(-5) || [] // 只保留最近5个行为
        });
        break;
        
      case 'reqError':
        reportData.errorMessage = data.data?.message || 'Request failed';
        reportData.requestUrl = data.data?.url || '';
        reportData.requestMethod = data.data?.method || 'GET';
        reportData.responseStatus = data.data?.status || 0;
        reportData.duration = data.data?.duration || 0;
        reportData.pageUrl = data.activePage || '';
        reportData.userId = data.customData?.userId || '';
        reportData.userAgent = data.systemInfo?.system || '';
        reportData.deviceInfo = JSON.stringify(data.systemInfo || {});
        reportData.networkInfo = JSON.stringify(data.network || {});
        reportData.extraData = JSON.stringify({
          scene: data.scene,
          requestData: data.data?.requestData || {}
        });
        break;
        
      case 'slowHttpRequest':
        reportData.errorMessage = 'Slow HTTP request detected';
        reportData.requestUrl = data.data?.url || '';
        reportData.requestMethod = data.data?.method || 'GET';
        reportData.responseStatus = data.data?.status || 200;
        reportData.duration = data.data?.duration || 0;
        reportData.pageUrl = data.activePage || '';
        reportData.userId = data.customData?.userId || '';
        reportData.userAgent = data.systemInfo?.system || '';
        reportData.deviceInfo = JSON.stringify(data.systemInfo || {});
        reportData.networkInfo = JSON.stringify(data.network || {});
        reportData.extraData = JSON.stringify({
          scene: data.scene,
          threshold: data.data?.threshold || 0
        });
        break;
        
      case 'performanceInfoReady':
        reportData.pageUrl = data.activePage || '';
        reportData.userId = data.customData?.userId || '';
        reportData.userAgent = data.systemInfo?.system || '';
        reportData.performanceData = JSON.stringify(data.data || {});
        reportData.deviceInfo = JSON.stringify(data.systemInfo || {});
        reportData.networkInfo = JSON.stringify(data.network || {});
        reportData.extraData = JSON.stringify({
          scene: data.scene
        });
        break;
        
      case 'unHandleRejection':
        reportData.errorMessage = data.data?.reason || 'Unhandled promise rejection';
        reportData.errorStack = data.data?.stack || '';
        reportData.pageUrl = data.activePage || '';
        reportData.userId = data.customData?.userId || '';
        reportData.userAgent = data.systemInfo?.system || '';
        reportData.deviceInfo = JSON.stringify(data.systemInfo || {});
        reportData.networkInfo = JSON.stringify(data.network || {});
        reportData.extraData = JSON.stringify({
          scene: data.scene,
          behavior: data.behavior?.slice(-5) || []
        });
        break;
        
      default:
        reportData.errorMessage = data.data?.message || 'Unknown event';
        reportData.pageUrl = data.activePage || '';
        reportData.userId = data.customData?.userId || '';
        reportData.userAgent = data.systemInfo?.system || '';
        reportData.deviceInfo = JSON.stringify(data.systemInfo || {});
        reportData.networkInfo = JSON.stringify(data.network || {});
        reportData.extraData = JSON.stringify(data);
        break;
    }

    return reportData;
  }

  /**
   * 立即上报队列中的数据
   */
  async flushData() {
    if (this.isReporting || this.dataQueue.length === 0) {
      return;
    }

    this.isReporting = true;
    const dataToReport = this.dataQueue.splice(0, this.batchSize);
    
    try {
      await this.reportData(dataToReport);
      console.log(`[Reporter] Successfully reported ${dataToReport.length} items`);
    } catch (error) {
      console.error('[Reporter] Failed to report data:', error);
      // 失败的数据重新加入队列
      this.dataQueue.unshift(...dataToReport);
    } finally {
      this.isReporting = false;
    }
  }

  /**
   * 上报数据到服务端
   * @param {Array} dataList 数据列表
   */
  async reportData(dataList) {
    return new Promise((resolve, reject) => {
      // 批量上报
      if (dataList.length > 1) {
        this.batchReport(dataList, resolve, reject);
      } else {
        // 单个上报
        this.singleReport(dataList[0], resolve, reject);
      }
    });
  }

  /**
   * 单个数据上报
   * @param {Object} data 数据
   * @param {Function} resolve 成功回调
   * @param {Function} reject 失败回调
   */
  singleReport(data, resolve, reject) {
    const requestData = {
      url: `${this.serverUrl}/api/monitor/report`,
      method: 'POST',
      data: data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
      },
      timeout: this.timeout,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.data?.message || 'Unknown error'}`));
        }
      },
      fail: (error) => {
        reject(new Error(`Request failed: ${error.errMsg || error.message || 'Unknown error'}`));
      }
    };

    // 使用wx.request发送请求
    if (typeof global !== 'undefined' && global.wx && global.wx.request) {
      global.wx.request(requestData);
    } else if (typeof wx !== 'undefined' && wx.request) {
      wx.request(requestData);
    } else {
      reject(new Error('wx.request is not available'));
    }
  }

  /**
   * 批量数据上报
   * @param {Array} dataList 数据列表
   * @param {Function} resolve 成功回调
   * @param {Function} reject 失败回调
   */
  batchReport(dataList, resolve, reject) {
    const requestData = {
      url: `${this.serverUrl}/api/error-logs/batch`,
      method: 'POST',
      data: dataList,
      header: {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : ''
      },
      timeout: this.timeout,
      success: (res) => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.data?.message || 'Unknown error'}`));
        }
      },
      fail: (error) => {
        reject(new Error(`Request failed: ${error.errMsg || error.message || 'Unknown error'}`));
      }
    };

    // 使用wx.request发送请求
    if (typeof global !== 'undefined' && global.wx && global.wx.request) {
      global.wx.request(requestData);
    } else if (typeof wx !== 'undefined' && wx.request) {
      wx.request(requestData);
    } else {
      reject(new Error('wx.request is not available'));
    }
  }

  /**
   * 启动批量上报定时器
   */
  startBatchReporting() {
    setInterval(() => {
      if (this.dataQueue.length > 0) {
        this.flushData();
      }
    }, this.flushInterval);
  }

  /**
   * 停止上报
   */
  stop() {
    // 立即上报剩余数据
    if (this.dataQueue.length > 0) {
      this.flushData();
    }
  }
}

// 导出
module.exports = {
  Reporter
};