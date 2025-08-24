/**
 * 控制台重写模块
 * JavaScript版本
 */

const { TrackerEvents, IBehaviorItemType } = require('./types/index.js');

/**
 * 重写console方法
 * @param {Object} monitor Monitor实例
 */
function rewriteConsole(monitor) {
  if (!monitor) {
    return;
  }

  // 需要监控的console方法
  const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'];
  
  consoleMethods.forEach(method => {
    if (console[method]) {
      const originalMethod = console[method];
      
      console[method] = function(...args) {
        // 记录console行为
        monitor.pushBehaviorItem({
          type: IBehaviorItemType.console,
          method: method,
          args: args,
          time: Date.now()
        });
        
        // 如果是错误级别，触发错误事件
        if (method === 'error') {
          const errorInfo = {
            message: args.join(' '),
            level: 'error',
            timestamp: Date.now(),
            source: 'console'
          };
          
          monitor.emit(TrackerEvents.jsError, errorInfo);
        }
        
        // 调用原始方法
        return originalMethod.apply(console, args);
      };
    }
  });
}

// 导出
module.exports = {
  rewriteConsole
};