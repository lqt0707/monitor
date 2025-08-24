const app = getApp();

Page({
  data: {
    testResults: []
  },
  
  onLoad() {
    console.log('[Index Page] Page loaded, SDK should be initialized');
    this.logTestResult('页面加载完成', 'SDK已在app.js中初始化');
  },
  
  onShow() {
    console.log('[Index Page] Page shown');
    this.logTestResult('页面显示', '触发onShow生命周期');
  },
  
  // 记录测试结果
  logTestResult(test, result) {
    const results = this.data.testResults;
    results.push({
      test: test,
      result: result,
      time: new Date().toLocaleTimeString()
    });
    this.setData({
      testResults: results
    });
    console.log(`[Test Result] ${test}: ${result}`);
  },
  
  onJsError() {
    console.log('[Index Page] Testing JavaScript Error...');
    this.logTestResult('JavaScript错误测试', '开始执行');
    try {
      throw new Error("测试JavaScript错误 - foo is not defined");
    } catch (e) {
      this.logTestResult('JavaScript错误测试', `捕获到错误: ${e.message}`);
      // 错误会被SDK自动捕获
    }
  },
  
  onHttpError() {
    console.log('[Index Page] Testing HTTP Error...');
    this.logTestResult('HTTP错误测试', '开始执行');
    wx.request({
      url: "https://nonexistent-domain-12345.com/api/test",
      method: 'GET',
      success: (res) => {
        this.logTestResult('HTTP错误测试', '意外成功: ' + JSON.stringify(res));
      },
      fail: (err) => {
        this.logTestResult('HTTP错误测试', '预期失败: ' + err.errMsg);
      }
    });
  },
  
  onPromiseError() {
    console.log('[Index Page] Testing Promise Error...');
    this.logTestResult('Promise错误测试', '开始执行');
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("测试Promise拒绝错误"));
      }, 100);
    }).catch(error => {
      this.logTestResult('Promise错误测试', `捕获到Promise错误: ${error.message}`);
    });
  },
  
  onTestSlowHttpRequest() {
    console.log('[Index Page] Testing Slow HTTP Request...');
    this.logTestResult('慢请求测试', '开始执行 (超时设置: 10ms)');
    const startTime = Date.now();
    wx.request({
      url: `https://www.baidu.com`,
      method: 'GET',
      success: (res) => {
        const duration = Date.now() - startTime;
        this.logTestResult('慢请求测试', `请求成功，耗时: ${duration}ms`);
      },
      fail: (err) => {
        const duration = Date.now() - startTime;
        this.logTestResult('慢请求测试', `请求失败，耗时: ${duration}ms, 错误: ${err.errMsg}`);
      }
    });
  },
  
  // 清空测试结果
  onClearResults() {
    this.setData({
      testResults: []
    });
    console.log('[Index Page] Test results cleared');
  },
  
  // 元素点击追踪测试
  onElementTrack(e) {
    console.log('[Index Page] Element clicked:', e.target);
    this.logTestResult('元素点击追踪', '检测到点击事件');
  }
});
