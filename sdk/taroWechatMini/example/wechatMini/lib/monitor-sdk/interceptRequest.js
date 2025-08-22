/**
 * 网络请求拦截模块
 * JavaScript版本
 */

const { TrackerEvents, IBehaviorItemType } = require('./types/index.js');

/**
 * 拦截网络请求
 * @param {Object} monitor Monitor实例
 */
function interceptRequest(monitor) {
  if (!monitor) {
    return;
  }

  // 保存原始的wx.request方法
  let originalRequest;
  
  try {
    if (typeof wx !== 'undefined' && wx.request) {
      originalRequest = wx.request;
    } else {
      console.warn('[InterceptRequest] wx.request not available');
      return;
    }
  } catch (e) {
    console.warn('[InterceptRequest] Cannot access wx object');
    return;
  }

  /**
   * 重写wx.request方法
   */
  function wrappedRequest(options) {
    if (!options || typeof options !== 'object') {
      return originalRequest.call(this, options);
    }

    const startTime = Date.now();
    const requestInfo = {
      url: options.url || '',
      method: options.method || 'GET',
      data: options.data || null,
      header: options.header || {}
    };

    // 记录请求开始行为
    monitor.pushBehaviorItem({
      type: IBehaviorItemType.http,
      method: 'request',
      args: requestInfo,
      time: startTime
    });

    // 包装成功回调
    const originalSuccess = options.success;
    options.success = function(res) {
      const endTime = Date.now();
      const timeConsume = endTime - startTime;

      // 记录请求成功行为
      monitor.pushBehaviorItem({
        type: IBehaviorItemType.http,
        method: 'request_success',
        args: {
          req: requestInfo,
          res: {
            statusCode: res.statusCode,
            data: res.data,
            header: res.header
          }
        },
        timeConsume: timeConsume,
        time: endTime
      });

      // 检查是否为慢请求
      if (monitor.$options.httpTimeout > 0 && timeConsume > monitor.$options.httpTimeout) {
        monitor.emit(TrackerEvents.slowHttpRequest, {
          req: requestInfo,
          res: {
            statusCode: res.statusCode,
            data: res.data,
            header: res.header
          },
          timeConsume: timeConsume,
          timestamp: endTime
        });
      }

      // 调用原始成功回调
      if (typeof originalSuccess === 'function') {
        originalSuccess.call(this, res);
      }
    };

    // 包装失败回调
    const originalFail = options.fail;
    options.fail = function(err) {
      const endTime = Date.now();
      const timeConsume = endTime - startTime;

      // 记录请求失败行为
      monitor.pushBehaviorItem({
        type: IBehaviorItemType.http,
        method: 'request_fail',
        args: {
          req: requestInfo,
          error: err
        },
        timeConsume: timeConsume,
        time: endTime
      });

      // 触发请求错误事件
      monitor.emit(TrackerEvents.reqError, {
        req: requestInfo,
        error: err,
        timeConsume: timeConsume,
        timestamp: endTime
      });

      // 调用原始失败回调
      if (typeof originalFail === 'function') {
        originalFail.call(this, err);
      }
    };

    // 调用原始请求方法
    return originalRequest.call(this, options);
  }

  // 替换wx.request
  try {
    if (typeof wx !== 'undefined') {
      wx.request = wrappedRequest;
    }
  } catch (e) {
    console.error('[InterceptRequest] Failed to intercept wx.request:', e);
  }
}

// 导出
module.exports = {
  interceptRequest
};