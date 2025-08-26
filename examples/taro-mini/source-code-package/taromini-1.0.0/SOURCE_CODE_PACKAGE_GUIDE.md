# Taro 小程序源代码打包指南

## 📦 打包脚本功能

本打包脚本专门为 Taro 小程序项目设计，用于收集所有源代码文件，便于上传到监控系统进行错误定位和源码映射。

## 🚀 快速开始

### 方法一：简单打包（推荐）
```bash
npm run pack:source
```

### 方法二：打包并创建压缩包
```bash
npm run pack:source:zip
```

## 📁 打包内容

### 包含的文件类型
- **JavaScript**: `.js`, `.jsx`
- **TypeScript**: `.ts`, `.tsx`  
- **样式文件**: `.css`, `.scss`, `.less`
- **HTML/模板**: `.html`
- **配置文件**: `.json`, `.xml`, `.yaml`, `.yml`
- **文档**: `.md`

### 包含的目录
- `src/` - 所有源代码文件
- `config/` - 项目配置文件
- `types/` - TypeScript 类型定义
- 项目根目录下的配置文件

### 排除的内容
- `node_modules/` - 第三方依赖
- `dist/` - 构建输出
- `build/` - 构建输出
- `.git/` - Git 版本控制
- `.husky/` - Git hooks
- `*.map` - Sourcemap 文件
- `*.log` - 日志文件

## 📊 输出结构

打包完成后会生成 `source-code-package/` 目录，包含：

```
source-code-package/
├── manifest.json          # 打包清单文件
├── src/                   # 源代码文件
│   ├── app.config.ts
│   ├── app.scss
│   ├── app.ts
│   ├── index.html
│   ├── pages/
│   └── utils/
├── config/                 # 配置文件
│   ├── dev.ts
│   ├── index.ts
│   └── prod.ts
├── types/                  # 类型定义
│   └── global.d.ts
└── 其他项目配置文件
```

## 🎯 使用场景

### 1. 错误定位
上传源代码后，当 Taro 小程序发生错误时，监控系统可以：
- 准确定位到具体的源代码文件
- 显示错误发生的行号和上下文
- 提供完整的调用栈信息

### 2. 性能分析
通过分析源代码结构，可以：
- 检测代码复杂度问题
- 识别安全漏洞
- 检查代码规范
- 分析依赖关系

### 3. 源码映射
建立 minified 代码与原始源代码的映射关系，便于调试。

## 🔧 手动打包（可选）

如果自动脚本不满足需求，可以手动选择文件：

```bash
# 进入项目目录
cd /Users/lqt/Desktop/package/monitor/examples/taro-mini

# 手动创建压缩包
zip -r taro-source-code.zip \
  src/ \
  config/ \
  types/ \
  *.json \
  *.js \
  *.ts \
  -x "node_modules/*" "dist/*" "*.map"
```

## 📋 上传步骤

1. **运行打包脚本**
   ```bash
   npm run pack:source
   ```

2. **打开监控系统**
   访问 http://localhost:5173/

3. **进入项目配置**
   - 选择对应的项目
   - 进入"源代码分析"选项卡

4. **上传文件**
   - 选择 `source-code-package/` 目录或 `taro-source-code.zip` 文件
   - 系统会自动分析并建立映射

## ⚠️ 注意事项

1. **敏感信息**：确保不包含敏感配置文件（如包含API密钥）
2. **文件大小**：单个文件建议不超过10MB
3. **更新频率**：代码修改后建议重新打包上传
4. **版本对应**：确保上传的源代码与线上运行的版本一致

## 🐛 故障排除

### 打包失败
- 检查 Node.js 版本（需要 Node.js 12+）
- 确保有足够的磁盘空间

### 上传失败
- 检查网络连接
- 确认监控服务正常运行

### 分析失败
- 确保文件格式支持
- 检查文件编码（建议UTF-8）

## 📞 支持

如有问题，请参考：
- [监控系统文档](../../README.md)
- [源代码分析功能说明](../../admin/README.md)

---

**最后更新**: {{当前日期}}
**版本**: 1.0.0