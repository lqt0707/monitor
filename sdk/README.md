# Monitor SDK - 多平台前端监控解决方案

[![npm version](https://img.shields.io/npm/v/@monitor/sdk.svg)](https://www.npmjs.com/package/@monitor/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@monitor/sdk.svg)](https://www.npmjs.com/package/@monitor/sdk)
[![license](https://img.shields.io/npm/l/@monitor/sdk.svg)](https://github.com/your-org/monitor/blob/main/LICENSE)

一个专业的前端监控SDK，支持Web和Taro小程序平台，提供错误监控、性能监控和用户行为分析。

## 🚀 30秒快速开始

### 1️⃣ 选择合适的包

| 包名 | 体积 | 适用场景 | 安装命令 |
|------|------|----------|----------|
| `@monitor/web-sdk` | ~15KB | **Web应用** (推荐) | `npm i @monitor/web-sdk` |
| `@monitor/taro-sdk` | ~12KB | **Taro小程序** (推荐) | `npm i @monitor/taro-sdk` |
| `@monitor/sdk` | ~20KB | 多平台/不确定 | `npm i @monitor/sdk` |
| `@monitor/core` | ~8KB | 自定义开发 | `npm i @monitor/core` |

> 💡 **推荐策略：** 优先选择平台专用包以获得最小体积和最佳性能

### 2️⃣ 快速集成

#### Web项目（推荐 @monitor/web-sdk）
```javascript
import Monitor from '@monitor/web-sdk';

// 30秒搞定
Monitor.quickStart.web('your-project-id', 'https://your-api.com');

// 或使用配置模板
import { Templates } from '@monitor/web-sdk';
const config = Templates.createConfig(Templates.WebBasic, {
  projectId: 'your-project-id',
  serverUrl: 'https://your-api.com'
});
Monitor.init(config);
```

#### Taro项目（推荐 @monitor/taro-sdk）
```javascript
import Monitor from '@monitor/taro-sdk';

// 30秒搞定
Monitor.quickStart.taro('your-project-id', 'https://your-api.com');
```

#### 多平台项目（使用 @monitor/sdk）
```javascript
import Monitor from '@monitor/sdk';

// 自动检测环境
Monitor.init({
  projectId: 'your-project-id',
  serverUrl: 'https://your-api.com'
});
```

### 3️⃣ 立即开始监控
```javascript
// 自动监控已启用，也可以手动记录
Monitor.captureError(new Error('测试错误'));
Monitor.recordPerformance('page_load', { duration: 1200 });
Monitor.recordBehavior('button_click', { buttonId: 'submit' });
```

## 📚 完整文档

### 快速导航
- [📖 快速开始指南](./QUICK_START.md) - 详细的使用教程
- [🔧 API文档](./API.md) - 完整的API参考
- [⚙️ 配置选项](./CONFIG.md) - 所有配置参数说明
- [💼 示例代码](./examples/) - 实际使用示例
- [🚨 故障排除](./TROUBLESHOOTING.md) - 常见问题解决
- [📋 最佳实践](./BEST_PRACTICES.md) - 推荐的使用方式

### 包说明文档
- [🌐 Web SDK 文档](./web-core/README.md)
- [📱 Taro SDK 文档](./taro-core/README.md)
- [🔩 Core 模块文档](./core/README.md)

## ✨ 核心特性

### 🎯 多平台支持
- ✅ **Web应用**: React、Vue、Angular等
- ✅ **Taro小程序**: 微信、支付宝、百度等
- ✅ **自动检测**: 无需手动指定平台
- ✅ **TypeScript**: 完整的类型定义

### 🔍 全面监控
- **错误监控**: JavaScript错误、Promise异常、资源加载失败
- **性能监控**: 页面加载时间、API响应时间、资源性能
- **行为分析**: 用户点击、页面访问、自定义事件
- **实时上报**: 可配置的批量上报和实时上报

### 🚀 开箱即用
- **零配置启动**: 提供多种配置模板
- **智能采样**: 可配置的采样率，平衡性能和数据完整性
- **自动降级**: 网络异常时自动重试和降级
- **体积优化**: 按需加载，最小运行时开销

## 🛠️ 高级用法

### 环境区分
```javascript
// 只在生产环境启用
if (process.env.NODE_ENV === 'production') {
  Monitor.init(productionConfig);
}
```

### 自定义配置
```javascript
Monitor.init({
  projectId: 'your-project-id',
  serverUrl: 'https://your-api.com',
  
  // 错误过滤
  error: {
    enabled: true,
    filters: [
      error => !error.message.includes('Script error')
    ]
  },
  
  // 性能阈值
  performance: {
    enabled: true,
    thresholds: {
      lcp: 2500,
      fcp: 1800
    }
  },
  
  // 自定义标签
  tags: {
    version: '1.2.3',
    feature: 'checkout'
  }
});
```

### 事件监听
```javascript
// 监听监控事件
Monitor.on('error', (errorData) => {
  console.log('捕获到错误:', errorData);
});

Monitor.on('performance', (perfData) => {
  console.log('性能数据:', perfData);
});
```

## 🏗️ 开发说明

### 项目结构
```
sdk/
├── package.json               # 统一构建配置
├── index.js                   # 主入口文件
├── templates.js               # 配置模板
├── QUICK_START.md            # 快速开始指南
├── TROUBLESHOOTING.md        # 故障排除
├── examples/                 # 使用示例
├── core/                     # 核心模块
├── web-core/                 # Web SDK
├── taro-core/                # Taro SDK
└── adapters/                 # 平台适配器
```

### 构建命令
```bash
npm run build              # 构建所有平台
npm run build:web          # 构建 Web SDK
npm run build:taro         # 构建 Taro SDK
npm run dev                # 开发模式
npm run test               # 运行测试
npm run size               # 检查包大小
```

### 发布流程
```bash
npm run publish:all        # 发布所有包
npm run publish:web        # 发布 Web SDK
npm run publish:taro       # 发布 Taro SDK
```

## 🆘 需要帮助？

### 快速诊断
```bash
# 运行帮助命令
npm run help

# 或在代码中
Monitor.help();
```

### 获取支持
- 📖 [查看文档](./QUICK_START.md)
- 🐛 [报告问题](https://github.com/your-org/monitor/issues)
- 💬 [参与讨论](https://github.com/your-org/monitor/discussions)
- 📧 [邮件支持](mailto:monitor-support@yourcompany.com)

### 常见问题
- **包体积过大？** → 使用平台专用包
- **TypeScript错误？** → 查看 [故障排除指南](./TROUBLESHOOTING.md)
- **初始化失败？** → 检查配置和网络连接
- **性能影响？** → 启用采样和合理配置

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](./CONTRIBUTING.md) 了解详情。

---

**⭐ 如果这个项目对你有帮助，请给我们一个星标！**