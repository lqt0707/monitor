# 贡献指南 (Contributing Guide)

感谢您对前端监控系统项目的关注！本指南将帮助您了解如何为项目做出贡献。

## 🚀 快速开始

### 1. 开发环境准备

```bash
# 1. Fork并克隆项目
git clone https://github.com/your-username/monitor-system.git
cd monitor-system

# 2. 一键启动开发环境
npm start

# 3. 运行测试确保环境正常
npm test
```

### 2. 开发工具

推荐使用以下开发工具：

- **IDE**: VSCode / WebStorm
- **Node.js**: >= 14.0.0
- **包管理**: npm (推荐) / yarn
- **Git**: 版本控制

## 📋 代码规范

### TypeScript 规范

- 使用严格的 TypeScript 配置
- 为所有公共 API 提供类型定义
- 优先使用接口 (interface) 而非类型别名 (type)
- 函数必须添加返回类型注解

```typescript
// ✅ 推荐
interface MonitorOptions {
  projectId: string;
  serverUrl: string;
}

function createMonitor(options: MonitorOptions): Monitor {
  // implementation
}

// ❌ 不推荐
function createMonitor(options: any) {
  // implementation
}
```

### 代码注释规范

- 所有公共函数必须添加 JSDoc 注释
- 复杂的业务逻辑需要添加行内注释
- 注释使用中文

```typescript
/**
 * 创建监控实例
 * @param options 监控配置选项
 * @returns 监控实例
 */
function createMonitor(options: MonitorOptions): Monitor {
  // 初始化配置
  const config = mergeConfig(defaultOptions, options);
  
  // 创建监控实例
  return new Monitor(config);
}
```

### 数据交互规范

- SDK开发需要严格遵循后端DTO定义的数据格式
- 对于不同的API端点需要实现不同的数据转换逻辑
- 单条数据上报时需要将复杂对象转换为JSON字符串
- 批量上报时需要保持对象格式并进行特定字段转换

## 🧪 测试规范

### 测试覆盖

每个新功能都需要相应的测试：

```bash
# 运行所有测试
npm test

# 运行特定测试
npm run test:format    # 数据格式测试
npm run test:network   # 网络错误测试
npm run test:integration # 集成测试
```

### 测试类型

1. **单元测试**: 测试独立的函数和类
2. **集成测试**: 测试模块间的交互
3. **网络错误测试**: 测试各种网络异常场景
4. **端到端测试**: 测试完整的用户流程

### 测试示例

```javascript
// 单元测试示例
describe('Monitor', () => {
  it('应该正确初始化监控实例', () => {
    const monitor = createMonitor({
      projectId: 'test',
      serverUrl: 'http://localhost:3001'
    });
    
    expect(monitor).toBeDefined();
    expect(monitor.projectId).toBe('test');
  });
});

// 网络错误测试示例  
describe('网络错误上报', () => {
  it('应该正确上报超时错误', async () => {
    const result = await testNetworkErrorType('timeout');
    expect(result.success).toBe(true);
  });
});
```

## 📁 项目结构

### 新增功能位置

```
monitor/
├── server/src/modules/     # 后端新模块
├── admin/src/pages/        # 前端新页面  
├── admin/src/components/   # 前端新组件
├── sdk/web/src/           # Web SDK功能
├── sdk/taroWechatMini/src/ # 小程序SDK功能
└── docs/                  # 文档更新
```

### 命名规范

- **文件名**: 使用 kebab-case (如: `error-monitor.ts`)
- **类名**: 使用 PascalCase (如: `ErrorMonitor`)
- **函数名**: 使用 camelCase (如: `createMonitor`)
- **常量**: 使用 UPPER_SNAKE_CASE (如: `DEFAULT_CONFIG`)

## 🔄 开发流程

### 1. 创建功能分支

```bash
# 从 main 分支创建新分支
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### 2. 开发和测试

```bash
# 开发过程中定期运行测试
npm test

# 检查代码质量
npm run lint  # 如果配置了 ESLint

# 构建检查
npm run build
```

### 3. 提交规范

使用约定式提交消息：

```bash
# 功能添加
git commit -m "feat: 添加网络错误监控功能"

# 问题修复  
git commit -m "fix: 修复数据上报格式错误"

# 文档更新
git commit -m "docs: 更新API文档"

# 测试添加
git commit -m "test: 添加网络错误测试用例"

# 代码重构
git commit -m "refactor: 重构数据转换逻辑"
```

### 4. 提交 Pull Request

1. 推送分支到 GitHub
2. 创建 Pull Request
3. 填写详细的PR描述
4. 等待代码审查

## 🐛 问题报告

### Bug 报告模板

```markdown
## 问题描述
简要描述遇到的问题

## 复现步骤
1. 执行步骤1
2. 执行步骤2
3. 看到错误

## 期望行为
描述期望的正确行为

## 实际行为
描述实际发生的错误行为

## 环境信息
- OS: [e.g. macOS 12.0]
- Node.js: [e.g. 16.14.0]
- npm: [e.g. 8.3.1]
- 浏览器: [e.g. Chrome 98.0]

## 附加信息
任何其他有用的信息、截图、日志等
```

### 功能请求模板

```markdown
## 功能描述
简要描述建议的功能

## 使用场景
描述在什么情况下需要此功能

## 解决方案
描述您期望的解决方案

## 替代方案
描述您考虑过的替代解决方案

## 附加上下文
任何其他相关的上下文或截图
```

## 📝 文档贡献

### 文档类型

- **API 文档**: 描述接口和SDK使用方法
- **开发指南**: 帮助开发者理解和扩展项目
- **用户手册**: 帮助用户使用监控系统
- **部署指南**: 生产环境部署说明

### 文档写作规范

- 使用清晰简洁的语言
- 提供完整的代码示例
- 包含必要的截图和图表
- 保持文档同步更新

## 🏆 贡献者

感谢所有为项目做出贡献的开发者！

## 📞 联系方式

如有任何疑问，可以通过以下方式联系：

- 提交 GitHub Issue
- 发送邮件到 support@monitor-system.com
- 参与项目讨论

---

再次感谢您的贡献！🎉