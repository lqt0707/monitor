# 监控SDK原生微信小程序测试项目

## 项目说明

这是一个用于测试监控SDK在原生微信小程序环境中功能的测试项目。该项目已经集成了适配后的监控SDK，可以测试各种监控功能。

## 项目结构

```
.
├── app.js                 # 应用入口文件，SDK初始化
├── app.json               # 应用配置文件
├── app.wxss               # 全局样式文件
├── lib/
│   └── monitor-sdk/       # 监控SDK源码（JavaScript版本）
│       ├── index.js       # SDK入口文件
│       ├── monitor.js     # 核心监控类
│       ├── types/         # 类型定义
│       ├── util.js        # 工具函数
│       ├── performance.js # 性能监控
│       ├── processData.js # 数据处理
│       ├── interceptRequest.js # 请求拦截
│       ├── rewriteApp.js  # 应用重写
│       ├── rewritePage.js # 页面重写
│       └── rewriteConsole.js # 控制台重写
├── pages/
│   ├── index/             # 测试页面
│   │   ├── index.js       # 页面逻辑
│   │   ├── index.wxml     # 页面结构
│   │   └── index.wxss     # 页面样式
│   └── about/             # 关于页面
├── utils/
│   └── util.js            # 工具函数
├── project.config.json    # 项目配置
├── sitemap.json          # 站点地图
└── README.md             # 说明文档
```

## SDK功能特性

### 已实现功能

1. **错误监控**
   - JavaScript错误捕获
   - Promise拒绝错误捕获
   - 应用级错误监控

2. **网络监控**
   - HTTP请求拦截
   - 请求错误捕获
   - 慢请求检测（可配置超时时间）

3. **性能监控**
   - 页面加载性能
   - 生命周期监控

4. **行为追踪**
   - 用户点击行为
   - 页面路由变化
   - 控制台输出监控

5. **自定义数据**
   - 支持设置自定义键值对
   - 支持批量设置自定义数据

## 使用方法

### 1. 在微信开发者工具中打开项目

```bash
# 使用命令行打开（如果已安装微信开发者工具命令行工具）
open -a "wechatwebdevtools" "/path/to/project"
```

### 2. SDK初始化

在 `app.js` 中已经完成了SDK的初始化：

```javascript
const { Monitor } = require("./lib/monitor-sdk/index.js");

// 初始化监控SDK
const monitor = Monitor.init({
  httpTimeout: 10 // 设置HTTP超时时间为10ms（用于测试慢请求）
});

// 设置自定义数据
monitor.setCustomData("foo", "bar");
monitor.setCustomData({
  bar: "foo"
});

// 监听所有事件
monitor.on("event", (eventName, emitData) => {
  console.log(eventName, emitData);
});
```

### 3. 测试功能

在首页（index页面）提供了以下测试功能：

1. **JavaScript错误测试**
   - 点击"触发JS错误"按钮
   - 会抛出一个测试错误，SDK会自动捕获

2. **Promise错误测试**
   - 点击"触发Promise错误"按钮
   - 会创建一个被拒绝的Promise，SDK会捕获未处理的拒绝

3. **HTTP错误测试**
   - 点击"触发HTTP错误"按钮
   - 会请求一个不存在的域名，SDK会捕获请求错误

4. **慢请求测试**
   - 点击"触发慢请求"按钮
   - 会请求百度首页，由于超时设置为10ms，会触发慢请求事件

### 4. 查看测试结果

- 页面下方会显示测试结果列表
- 打开微信开发者工具的控制台，可以看到详细的监控日志
- 点击"清空结果"按钮可以清空测试结果

## 监控事件类型

SDK支持以下事件类型：

- `jsError`: JavaScript错误
- `reqError`: 网络请求错误
- `unHandleRejection`: 未处理的Promise拒绝
- `slowHttpRequest`: 慢HTTP请求
- `performanceInfoReady`: 性能信息就绪
- `event`: 所有事件的通用监听器

## 配置选项

```javascript
const monitor = Monitor.init({
  httpTimeout: 5000,        // HTTP超时时间（毫秒）
  enablePerformance: true,  // 启用性能监控
  enableError: true,        // 启用错误监控
  enableHttp: true,         // 启用HTTP监控
  // 更多配置选项...
});
```

## 开发说明

### SDK适配说明

本SDK已经从TypeScript转换为JavaScript，以便在原生微信小程序环境中直接使用，无需编译步骤。主要适配工作包括：

1. **类型系统移除**: 将TypeScript类型定义转换为JavaScript注释
2. **模块系统**: 使用CommonJS模块系统（require/module.exports）
3. **环境兼容**: 添加了对微信小程序环境的检测和适配
4. **错误处理**: 增强了错误处理机制，避免在不同环境下出现问题

### 调试技巧

1. **控制台日志**: 在微信开发者工具的控制台中查看详细日志
2. **网络面板**: 查看网络请求的拦截情况
3. **断点调试**: 在SDK源码中设置断点进行调试

## 注意事项

1. **开发环境**: 请确保使用最新版本的微信开发者工具
2. **网络权限**: 测试网络功能时需要配置合适的域名白名单
3. **真机测试**: 建议在真机上进行完整的功能测试
4. **性能影响**: 监控功能会对性能产生一定影响，生产环境请合理配置

## 问题排查

如果遇到问题，请检查：

1. 微信开发者工具控制台是否有错误信息
2. SDK文件是否正确加载
3. 网络请求是否被正确拦截
4. 事件监听器是否正确注册

## 更新日志

- **v1.0.0**: 初始版本，支持基本的错误监控、网络监控和性能监控功能
- **v1.1.0**: 添加了原生微信小程序适配，支持JavaScript版本