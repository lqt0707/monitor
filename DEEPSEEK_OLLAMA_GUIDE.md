# DeepSeek本地调试指南

本文档介绍如何在本地调试时使用Ollama部署的DeepSeek模型以及官方API。

## 🎯 功能特性

- ✅ 支持官方DeepSeek API（生产环境）
- ✅ 支持本地Ollama部署（开发调试）
- ✅ 自动切换机制
- ✅ 灵活的配置选项

## 📋 配置选项

### 环境变量配置

在 `.env` 文件中配置以下选项：

```bash
# DeepSeek官方API配置（生产环境）
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=2000
DEEPSEEK_TEMPERATURE=0.1

# 本地Ollama配置（开发调试）
DEEPSEEK_USE_OLLAMA=false
OLLAMA_BASE_URL=http://localhost:11434/v1
```

### 配置说明

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `DEEPSEEK_API_KEY` | - | DeepSeek官方API密钥 |
| `DEEPSEEK_MODEL` | `deepseek-chat` | 使用的模型名称 |
| `DEEPSEEK_MAX_TOKENS` | `2000` | 最大生成令牌数 |
| `DEEPSEEK_TEMPERATURE` | `0.1` | 生成温度（创造性） |
| `DEEPSEEK_USE_OLLAMA` | `false` | 是否使用本地Ollama |
| `OLLAMA_BASE_URL` | `http://localhost:11434/v1` | Ollama服务地址 |

## 🚀 使用方式

### 1. 官方API模式（生产环境）

```bash
# 设置官方API密钥
DEEPSEEK_API_KEY=your_actual_api_key_here
DEEPSEEK_USE_OLLAMA=false

# 启动服务
npm run start:dev
```

### 2. 本地Ollama模式（开发调试）

#### 步骤1：安装和启动Ollama

```bash
# 安装Ollama（macOS）
brew install ollama

# 启动Ollama服务
ollama serve
```

#### 步骤2：拉取DeepSeek模型

```bash
# 拉取DeepSeek Coder模型
ollama pull deepseek-coder

# 或者拉取其他DeepSeek模型
ollama pull deepseek-chat
```

#### 步骤3：配置环境变量

```bash
# 启用本地Ollama
DEEPSEEK_USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434/v1

# API密钥可以留空（Ollama不需要）
DEEPSEEK_API_KEY=

# 使用本地模型
DEEPSEEK_MODEL=deepseek-coder
```

#### 步骤4：启动服务

```bash
# 启动开发服务器
npm run start:dev
```

### 3. 自定义Ollama地址

如果你的Ollama服务运行在其他机器上：

```bash
# 使用远程Ollama服务
DEEPSEEK_USE_OLLAMA=true
OLLAMA_BASE_URL=http://192.168.1.100:11434/v1
DEEPSEEK_MODEL=deepseek-coder
```

## 🧪 测试配置

项目提供了测试脚本来验证配置：

```bash
# 运行Ollama配置测试
cd server
npm run test:ollama
```

测试脚本会模拟三种场景：
1. 官方API模式
2. 本地Ollama模式  
3. 自定义Ollama地址模式

## 🔧 技术实现

### 配置加载

在 `DeepSeekService` 中动态加载配置：

```typescript
private async initializeDeepSeek(): Promise<void> {
  const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
  const useLocalOllama = this.configService.get<boolean>('DEEPSEEK_USE_OLLAMA', false);
  const ollamaBaseUrl = this.configService.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434/v1');

  let baseURL = 'https://api.deepseek.com/v1';
  let openAIApiKey = apiKey;
  
  if (useLocalOllama) {
    baseURL = ollamaBaseUrl;
    openAIApiKey = 'ollama'; // Ollama不需要真实的API密钥
  }
}
```

### 自动回退机制

- 如果配置了官方API密钥，优先使用官方API
- 如果启用本地Ollama，使用本地部署
- 如果两者都未配置，AI功能将不可用

## 🐛 常见问题

### Q: Ollama服务连接失败

**A:** 检查Ollama服务是否正常运行：
```bash
# 检查Ollama状态
ollama list

# 重启Ollama服务
ollama serve
```

### Q: 模型下载失败

**A:** 检查网络连接并重新拉取模型：
```bash
# 重新拉取模型
ollama pull deepseek-coder
```

### Q: API请求超时

**A:** 调整超时时间或检查网络连接：
```typescript
// 在DeepSeekService中调整超时时间
timeout: 120000, // 120秒超时
```

## 📊 性能对比

| 指标 | 官方API | 本地Ollama |
|------|---------|------------|
| 响应速度 | 中等 | 快速（本地网络） |
| 可用性 | 依赖网络 | 本地可用 |
| 成本 | API调用费用 | 免费（本地资源） |
| 模型选择 | 丰富 | 有限（需手动下载） |

## 🔒 安全建议

1. **不要将API密钥提交到版本控制**
2. **生产环境使用官方API**
3. **开发环境可以使用本地Ollama**
4. **定期更新Ollama和模型**

## 📝 版本历史

- **v1.0.0** (2024-01-20): 初始版本，支持官方API和本地Ollama

## 🆘 获取帮助

如果遇到问题，请参考：
- [Ollama官方文档](https://ollama.ai/)
- [DeepSeek API文档](https://platform.deepseek.com/)
- 项目README.md文件

---

**Happy Coding! 🚀**