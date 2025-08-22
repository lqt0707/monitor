/**
 * SDK导入测试脚本
 * 验证npm包是否能正确导入
 */

console.log('[Test] 开始测试SDK导入...');

try {
  // 测试导入
  const sdk = require('@monitor/taro-wechat-mini-sdk');
  console.log('[Test] ✅ SDK导入成功');
  console.log('[Test] 导出的内容:', Object.keys(sdk));
  
  // 检查Monitor类是否存在
  if (sdk.Monitor) {
    console.log('[Test] ✅ Monitor类存在');
    console.log('[Test] Monitor类型:', typeof sdk.Monitor);
    
    // 检查静态方法
    if (typeof sdk.Monitor.init === 'function') {
      console.log('[Test] ✅ Monitor.init方法存在');
    } else {
      console.log('[Test] ❌ Monitor.init方法不存在');
    }
  } else {
    console.log('[Test] ❌ Monitor类不存在');
  }
  
  console.log('[Test] 🎉 基本导入测试通过');
  
} catch (error) {
  console.error('[Test] ❌ SDK导入失败:', error.message);
  process.exit(1);
}