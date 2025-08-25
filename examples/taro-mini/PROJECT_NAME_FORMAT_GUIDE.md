# 项目名称格式化指南

## 📋 问题说明

当项目名称是 `taromini`（小写）时，打包后的 `projectId` 会保持原始格式，不会被自动转换为 `taroMini`（驼峰格式）。

## 🔧 解决方案

我已经在 `pack-source-code-optimized.js` 中添加了项目名称格式化选项，你可以根据需要选择不同的格式。

### 当前配置位置

在 `getProjectInfo()` 函数中：

```javascript
// 获取原始项目名称
let projectName = packageInfo.name || 'taro-mini-project';

// 项目名称格式化选项 - 可以根据需要修改
// 选项1: 保持原样 (默认)
// projectName = projectName;

// 选项2: 转换为小写
// projectName = projectName.toLowerCase();

// 选项3: 转换为短横线格式 (kebab-case)
// projectName = projectName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
```

## 🎯 使用方法

### 方法1: 修改 package.json
直接修改 `package.json` 中的项目名称：

```json
{
  "name": "taromini",  // 使用你想要的格式
  "version": "1.0.0",
  ...
}
```

### 方法2: 在打包脚本中启用格式化
编辑 `pack-source-code-optimized.js`，取消注释相应的格式化选项：

#### 强制转换为小写
```javascript
// 选项2: 转换为小写
projectName = projectName.toLowerCase();
```

#### 转换为短横线格式
```javascript
// 选项3: 转换为短横线格式 (kebab-case)
projectName = projectName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
```

## 📊 格式化示例

| 原始名称 | 保持原样 | 小写格式 | 短横线格式 |
|---------|---------|---------|-----------|
| `taroMini` | `taroMini` | `taromini` | `taro-mini` |
| `TaroMiniApp` | `TaroMiniApp` | `tarominiapp` | `taro-mini-app` |
| `myProject` | `myProject` | `myproject` | `my-project` |

## 🚀 测试验证

修改后，运行打包脚本验证结果：

```bash
npm run pack:source:optimized
```

检查生成的 `manifest.json` 中的 `projectId` 字段是否符合预期格式。

## 💡 推荐做法

1. **统一命名**: 建议在 `package.json` 中直接使用你想要的项目名称格式
2. **保持一致**: 确保项目名称在整个系统中保持一致
3. **避免特殊字符**: 项目名称避免使用特殊字符，推荐使用字母、数字、短横线

## 🔍 验证步骤

1. 修改项目名称格式
2. 运行 `npm run pack:source:optimized`
3. 检查 `source-code-package/taroMini-1.0.0/manifest.json`
4. 确认 `projectId` 字段格式正确
5. 上传到监控系统验证

---

**更新时间**: 2025-08-26  
**版本**: 1.0.0