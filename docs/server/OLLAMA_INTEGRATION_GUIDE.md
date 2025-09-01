# 监控系统本地Ollama集成指南

## 📋 概述

本文档详细说明如何在监控系统中配置和使用本地Ollama服务，替代官方的DeepSeek API，实现完全离线的AI错误诊断功能。

## 🚀 快速开始

### 1. 安装和启动Ollama

```bash
# 安装Ollama
brew install ollama

# 启动Ollama服务
ollama serve

# 拉取DeepSeek模型
ollama pull deepseek-r1:latest

# 验证模型运行
ollama run deepseek-r1 "Hello, how are you?"
```

### 2. 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# 启用本地Ollama模式
DEEPSEEK_USE_OLLAMA=true

# Ollama服务地址（默认localhost:11434）
OLLAMA_BASE_URL=http://localhost:11434/v1

# 可选：DeepSeek模型名称（默认deepseek-chat）
DEEPSEEK_MODEL=deepseek-r1

# 可选：API超时时间（毫秒）
DEEPSEEK_MAX_TOKENS=2000
DEEPSEEK_TEMPERATURE=0.1
```

### 3. 重启监控服务

```bash
# 重启NestJS服务
npm run start:dev
```

## ⚙️ 详细配置说明

### 环境变量详解

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DEEPSEEK_USE_OLLAMA` | `false` | 是否启用本地Ollama模式 |
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama API基础地址 |
| `DEEPSEEK_MODEL` | `deepseek-chat` | 使用的模型名称 |
| `DEEPSEEK_MAX_TOKENS` | `2000` | 最大生成token数 |
| `DEEPSEEK_TEMPERATURE` | `0.1` | 生成温度（创造性） |

### 支持的模型

监控系统支持以下Ollama模型：
- `deepseek-r1:latest` - DeepSeek R1 70B模型
- `deepseek-coder:latest` - DeepSeek Coder代码模型
- `llama3:latest` - Meta Llama 3模型
- 其他兼容OpenAI API格式的模型

## 🔧 高级配置

### 自定义模型配置

如果需要使用其他模型，可以修改模型配置：

```env
# 使用Llama 3模型
DEEPSEEK_MODEL=llama3:latest

# 调整生成参数
DEEPSEEK_MAX_TOKENS=4000
DEEPSEEK_TEMPERATURE=0.7
```

### 网络配置

如果Ollama运行在其他机器上：

```env
# 远程Ollama服务器
OLLAMA_BASE_URL=http://192.168.1.100:11434/v1

# 或者使用域名
OLLAMA_BASE_URL=https://ollama.your-domain.com/v1
```

### 超时配置

根据网络状况调整超时时间：

```typescript
// 在DeepSeek服务中调整超时
this.deepSeekModel = new ChatOpenAI({
  timeout: 120000, // 120秒超时
});
```

## 🧪 测试配置

### 1. 创建测试脚本

创建 `/scripts/test-ollama-connection.js`：

```javascript
const { ConfigService } = require('@nestjs/config');
const { DeepSeekService } = require('../src/modules/deepseek/deepseek.service');

async function testOllama() {
  const configService = new ConfigService();
  const deepSeekService = new DeepSeekService(configService);
  
  // 等待服务初始化
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('🧪 测试Ollama连接...');
  
  try {
    const result = await deepSeekService.analyzeJavaScriptError(
      'TypeError: Cannot read properties of undefined (reading \'name\')',
      'function UserProfile({ user }) {\n  return <div>{user.name}</div>;\n}'
    );
    
    console.log('✅ Ollama连接成功！');
    console.log('分析结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Ollama连接失败:', error.message);
  }
}

testOllama();
```

### 2. 运行测试

```bash
cd /Users/lqt/Desktop/package/monitor/server
node scripts/test-ollama-connection.js
```

## 🚨 故障排除

### 常见问题

1. **连接超时**
   ```bash
   # 检查Ollama服务状态
   ollama ps
   
   # 测试API端点
   curl http://localhost:11434/v1/models
   ```

2. **模型未加载**
   ```bash
   # 重新拉取模型
   ollama pull deepseek-r1:latest
   
   # 重启Ollama服务
   pkill -f "ollama serve"
   ollama serve
   ```

3. **内存不足**
   ```bash
   # 检查GPU内存
   nvidia-smi
   
   # 使用较小模型
   ollama pull deepseek-coder:6.7b
   ```

### 日志调试

启用详细日志：

```typescript
// 在DeepSeek服务中启用调试
private readonly logger = new Logger(DeepSeekService.name);

// 添加详细日志
this.logger.debug(`Ollama请求: ${JSON.stringify(request)}`);
this.logger.debug(`Ollama响应: ${JSON.stringify(response)}`);
```

## 📊 性能优化

### 响应时间优化

1. **调整超时设置**
   ```typescript
   timeout: 60000, // 60秒超时（默认）
   timeout: 120000, // 120秒超时（慢速网络）
   ```

2. **批量处理**
   ```typescript
   // 批量处理错误分析
   async batchAnalyzeErrors(errorBatches: ErrorBatch[]) {
     const results = await Promise.all(
       errorBatches.map(batch => 
         this.deepSeekService.analyzeJavaScriptError(batch.errorStack)
       )
     );
   }
   ```

### 资源管理

1. **内存优化**
   ```bash
   # 限制Ollama内存使用
   OLLAMA_MAX_LOADED_MODELS=2
   OLLAMA_NUM_PARALLEL=1
   ```

2. **GPU优化**
   ```bash
   # 指定GPU设备
   CUDA_VISIBLE_DEVICES=0 ollama serve
   ```

## 🔒 安全考虑

### 网络安全

1. **内网部署**
   ```env
   # 仅限内网访问
   OLLAMA_BASE_URL=http://192.168.1.100:11434/v1
   ```

2. **身份验证**
   ```bash
   # 启用Ollama身份验证
   ollama serve --auth
   ```

### 数据隐私

使用本地Ollama的优势：
- 错误数据不会离开本地网络
- 无需向第三方API发送敏感信息
- 完全符合数据保护法规

## 📈 监控和日志

### 服务监控

添加Ollama健康检查：

```typescript
// 定期检查Ollama服务状态
@Cron('*/5 * * * *') // 每5分钟检查一次
async checkOllamaHealth() {
  try {
    const response = await axios.get(`${this.ollamaBaseUrl}/health`);
    this.logger.log(`Ollama服务健康: ${response.status}`);
  } catch (error) {
    this.logger.error(`Ollama服务异常: ${error.message}`);
  }
}
```

### 性能日志

记录AI诊断性能指标：

```typescript
// 记录响应时间
const startTime = Date.now();
const result = await this.deepSeekService.analyzeJavaScriptError(errorStack);
const responseTime = Date.now() - startTime;

this.logger.log(`AI诊断完成，耗时: ${responseTime}ms`);
```

## 🎯 最佳实践

### 开发环境

1. **使用轻量级模型**
   ```bash
   # 开发环境使用较小模型
   ollama pull deepseek-coder:6.7b
   ```

2. **本地调试**
   ```bash
   # 启用详细日志
   DEBUG=deepseek* npm run start:dev
   ```

### 生产环境

1. **高可用部署**
   ```bash
   # 多节点Ollama集群
   OLLAMA_BASE_URL=负载均衡地址
   ```

2. **性能监控**
   ```typescript
   // 集成到现有监控系统
   this.monitorService.trackAIPerformance({
     responseTime,
     success: true,
     model: 'deepseek-r1'
   });
   ```

## 🔮 未来扩展

### 计划功能

1. **多模型支持**
   - 动态模型选择
   - 模型性能对比
   - 自动故障转移

2. **高级分析**
   - 错误模式识别
   - 趋势分析
   - 预测性维护

3. **集成扩展**
   - 自定义模型适配器
   - 第三方模型支持
   - 混合云部署

## 📞 支持

如有问题，请参考：
- [Ollama官方文档](https://ollama.ai)
- [DeepSeek模型文档](https://deepseek.com)
- 项目中的 `DEEPSEEK_OLLAMA_GUIDE.md`

或联系开发团队获取支持。