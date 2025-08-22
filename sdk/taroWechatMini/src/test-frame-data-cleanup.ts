/**
 * frameData清理功能测试文件
 * 用于验证Reporter类是否正确清理frameData字段
 */

import { Reporter } from './reporter';

// 模拟测试数据
const testDataWithFrameData = {
  type: 'jsError',
  message: '测试错误信息',
  stack: '错误堆栈信息',
  frameData: {
    url: 'http://example.com/test.js',
    line: 123,
    column: 45,
    function: 'testFunction',
    context: '错误上下文信息',
    deep: {
      nested: {
        frameData: '深层嵌套的frameData'
      }
    }
  },
  customData: {
    userInfo: {
      name: '张三',
      frameData: '用户信息中的frameData'
    },
    settings: {
      FrameData: '大小写变体的frameData'
    }
  },
  arrayData: [
    {
      item: 1,
      frameData: '数组中的frameData'
    },
    {
      item: 2,
      nested: {
        frameData: '数组中嵌套的frameData'
      }
    }
  ]
};

// 创建Reporter实例
const reporter = new Reporter({
  serverUrl: 'http://localhost:3000',
  projectId: 'test-project',
  enableOfflineCache: false
});

// 测试函数
function testFrameDataCleanup() {
  console.log('=== 测试frameData清理功能 ===');
  
  console.log('原始数据:', JSON.stringify(testDataWithFrameData, null, 2));
  
  // 使用私有方法测试（需要类型断言）
  const cleanedData = (reporter as any).deepCleanFrameData(testDataWithFrameData);
  
  console.log('清理后数据:', JSON.stringify(cleanedData, null, 2));
  
  // 验证结果
  const hasFrameData = JSON.stringify(cleanedData).toLowerCase().includes('framedata');
  
  if (!hasFrameData) {
    console.log('✅ 测试通过：所有frameData字段已被成功清理');
  } else {
    console.log('❌ 测试失败：仍有frameData字段残留');
  }
  
  // 验证必要字段保留
  if (cleanedData.type && cleanedData.message && cleanedData.stack) {
    console.log('✅ 必要字段保留验证通过');
  } else {
    console.log('❌ 必要字段丢失');
  }
}

// 运行测试
if (typeof module !== 'undefined' && module.exports) {
  testFrameDataCleanup();
} else {
  // 浏览器环境
  (window as any).testFrameDataCleanup = testFrameDataCleanup;
}