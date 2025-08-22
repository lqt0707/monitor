# Taro微信小程序监控SDK改造计划

## 改造背景
将原生微信小程序错误监控SDK改造为适用于Taro微信小程序的SDK。

## Taro与原生小程序的主要差异

### 1. 页面结构差异
- **原生小程序**: 使用`Page({})`构造函数创建页面
- **Taro**: 使用React Class组件或函数组件，编译后生成小程序页面

### 2. 生命周期差异
- **原生小程序**: `onLoad`, `onShow`, `onHide`等
- **Taro**: React生命周期 + 小程序生命周期混合使用

### 3. API调用方式
- **原生小程序**: 直接使用`wx.xxx`
- **Taro**: 通过`@tarojs/taro`导入使用，如`Taro.xxx`

## 改造要点

### 1. 类型定义改造 (types/index.ts)
- 更新`ActivePage`类型定义，兼容Taro页面实例
- 添加Taro相关的类型导入

### 2. 页面监控改造 (rewritePage.ts)
- 适配Taro的页面结构
- 处理React组件生命周期与小程序生命周期的映射
- 保持对原生Page的兼容性

### 3. App监控改造 (rewriteApp.ts)
- 适配Taro的App结构
- 处理Taro App与原生App的差异

### 4. 工具函数改造 (util.ts)
- 更新`getCurrentPages`的使用方式
- 确保在Taro环境下能正确获取页面信息

### 5. API调用改造
- 兼容`wx.xxx`和`Taro.xxx`两种调用方式
- 添加Taro API的类型支持

## 改造策略

1. **向后兼容**: 保持对原生小程序的支持
2. **渐进式改造**: 逐步添加Taro支持，不破坏现有功能
3. **类型安全**: 确保TypeScript类型定义的准确性
4. **功能完整**: 保持所有监控功能的完整性

## 实施步骤

1. 更新package.json，添加Taro相关依赖
2. 修改类型定义，支持Taro页面结构
3. 改造页面监控模块
4. 改造App监控模块
5. 更新工具函数
6. 测试验证功能完整性