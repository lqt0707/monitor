// 测试 SDK 导入
try {
    console.log('开始测试 SDK 导入...');

    // 测试从 @monitor/sdk/taro 导入
    const Monitor = require('@monitor/sdk/taro');
    console.log('✅ SDK 导入成功:', Monitor);

    if (Monitor && typeof Monitor.init === 'function') {
        console.log('✅ Monitor.init 方法存在');
    } else {
        console.log('❌ Monitor.init 方法不存在');
    }

} catch (error) {
    console.error('❌ SDK 导入失败:', error.message);
    console.error('错误详情:', error);
}