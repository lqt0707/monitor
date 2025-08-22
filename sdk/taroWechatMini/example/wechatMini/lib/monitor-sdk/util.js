/**
 * 工具函数模块
 * JavaScript版本
 */

/**
 * 获取系统信息
 * @returns {Promise<Object>} 系统信息
 */
function getSystemInfo() {
  return new Promise((resolve, reject) => {
    if (typeof wx !== 'undefined' && wx.getSystemInfo) {
      wx.getSystemInfo({
        success: resolve,
        fail: reject
      });
    } else {
      reject(new Error('wx.getSystemInfo not available'));
    }
  });
}

/**
 * 获取网络信息
 * @returns {Promise<Object>} 网络信息
 */
function getNetworkInfo() {
  return new Promise((resolve, reject) => {
    if (typeof wx !== 'undefined' && wx.getNetworkType) {
      wx.getNetworkType({
        success: (res) => {
          resolve({
            networkType: res.networkType,
            isConnected: res.networkType !== 'none',
            timestamp: Date.now()
          });
        },
        fail: reject
      });
    } else {
      reject(new Error('wx.getNetworkType not available'));
    }
  });
}

/**
 * 获取当前页面路径
 * @returns {string} 页面路径
 */
function getCurrentPagePath() {
  try {
    if (typeof getCurrentPages === 'function') {
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        return currentPage.route || currentPage.__route__ || '';
      }
    }
    return '';
  } catch (e) {
    return '';
  }
}

/**
 * 格式化时间戳
 * @param {number} timestamp 时间戳
 * @returns {string} 格式化后的时间
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * 深度克隆对象
 * @param {any} obj 要克隆的对象
 * @returns {any} 克隆后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

/**
 * 生成UUID
 * @returns {string} UUID字符串
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 安全的JSON序列化
 * @param {any} obj 要序列化的对象
 * @returns {string} JSON字符串
 */
function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return '[Circular or Invalid Object]';
  }
}

/**
 * 检查是否为空对象
 * @param {any} obj 要检查的对象
 * @returns {boolean} 是否为空对象
 */
function isEmptyObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return true;
  }
  return Object.keys(obj).length === 0;
}

// 网络信息接口定义（用于类型提示）
const INetworkInfo = {
  networkType: '',
  isConnected: false,
  timestamp: 0
};

// 导出
module.exports = {
  getSystemInfo,
  getNetworkInfo,
  getCurrentPagePath,
  formatTime,
  deepClone,
  generateUUID,
  safeStringify,
  isEmptyObject,
  INetworkInfo
};