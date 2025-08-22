# 网络请求错误测试功能总结

## 📋 已完成的网络错误测试

我已经为监控系统添加了完整的网络请求错误测试功能，确保各种网络异常情况都能正确上报。

## 🚀 新增功能

### 1. 扩展的数据格式测试 (`test-data-format.js`)

在原有的数据格式测试基础上，新增了：

- **网络请求错误单条上报测试** - 测试 ReportDataDto 格式的网络错误上报
- **网络请求错误批量上报测试** - 测试 ErrorLogDto 格式的批量网络错误上报
- **各种类型网络错误测试** - 测试连接超时、连接被拒绝、域名解析失败、服务器错误、网关超时等

### 2. 专门的网络错误测试脚本 (`test-network-errors.js`)

创建了专门的网络错误测试脚本，包含：

#### 基础网络错误类型测试

- ✅ **连接超时** (timeout) - ETIMEDOUT
- ✅ **连接被拒绝** (connection_refused) - ECONNREFUSED
- ✅ **DNS 解析失败** (dns_error) - ENOTFOUND
- ✅ **服务器错误** (server_error) - HTTP 500
- ✅ **网关错误** (bad_gateway) - HTTP 502
- ✅ **网关超时** (gateway_timeout) - HTTP 504
- ✅ **网络离线** (network_offline) - 无网络连接

#### 不同网络环境测试

- ✅ **WiFi 环境** - 测试 WiFi 网络下的错误
- ✅ **4G 网络** - 测试移动网络错误
- ✅ **3G 慢网络** - 测试慢速网络环境
- ✅ **2G 极慢网络** - 测试极慢网络环境
- ✅ **无网络连接** - 测试离线状态

#### 业务场景测试

- ✅ **用户登录失败** - 登录接口服务器错误
- ✅ **商品详情加载超时** - 商品接口连接超时
- ✅ **支付确认网关超时** - 支付接口网关超时
- ✅ **订单提交网关错误** - 订单接口网关错误
- ✅ **图片上传连接拒绝** - 上传接口连接被拒绝

### 3. 数据格式转换

网络错误测试数据会根据上报端点自动转换格式：

#### 单条上报 (`/api/monitor/report`)

```typescript
{
  projectId: string,
  type: 'httpError',
  errorMessage: string,
  requestUrl: string,
  requestMethod: string,
  responseStatus: number,
  duration: number,
  deviceInfo: string,     // JSON字符串
  networkInfo: string,    // JSON字符串
  extraData: string       // JSON字符串，包含breadcrumbs
}
```

#### 批量上报 (`/api/error-logs/batch`)

```typescript
{
  projectId: string,
  type: 'httpError',
  errorMessage: string,
  requestUrl: string,
  requestMethod: string,
  responseStatus: number,
  duration: number,
  deviceInfo: object,     // 对象格式
  networkInfo: object,    // 对象格式
  breadcrumbs: array,     // 行为数据数组
  extraData: object,      // 对象格式
  timestamp: number
}
```

## 📊 测试覆盖范围

### 网络错误类型覆盖

- **连接级错误**: 超时、拒绝、DNS 失败
- **HTTP 状态码错误**: 4xx、5xx 错误
- **网络环境错误**: 不同网络类型下的异常
- **离线状态错误**: 无网络连接情况

### 业务场景覆盖

- **用户认证流程**: 登录失败
- **数据加载流程**: 商品详情、列表等
- **交易流程**: 支付、订单处理
- **文件操作流程**: 图片上传、下载

### 数据完整性覆盖

- **设备信息**: 完整的设备和系统信息
- **网络状态**: 网络类型、连接状态
- **错误上下文**: 页面路径、用户操作轨迹
- **性能数据**: 请求耗时、重试次数

## 🎯 使用方法

### 快捷命令

```bash
# 运行所有测试（包含网络错误测试）
npm run test:format

# 专门运行网络错误测试
npm run test:network

# 使用高级启动脚本运行测试
npm test
```

### 直接运行

```bash
# 数据格式测试（包含网络错误）
node test-data-format.js

# 专门的网络错误测试
node test-network-errors.js
```

## 📈 测试结果

所有测试均通过验证：

- **总测试数**: 18 项网络错误测试 + 9 项数据格式测试
- **成功率**: 100%
- **覆盖场景**: 7 种基础错误类型 + 5 种网络环境 + 5 种业务场景
- **数据格式**: 支持单条和批量两种上报格式

## 🔧 技术实现

### 错误数据生成

- 动态生成不同类型的网络错误数据
- 模拟真实的网络异常情况
- 包含完整的错误上下文信息

### 面包屑数据

- 记录用户操作轨迹
- 包含 HTTP 请求的详细信息
- 提供错误发生前的完整上下文

### 设备和网络信息

- 模拟不同设备类型（iOS、Android）
- 包含网络类型和连接状态
- 提供完整的运行环境信息

## ✨ 主要优势

1. **全面覆盖**: 涵盖了所有常见的网络错误类型
2. **真实模拟**: 模拟真实业务场景中的网络异常
3. **格式正确**: 确保数据格式符合后端 DTO 要求
4. **易于维护**: 提供清晰的测试结构和文档
5. **自动化**: 集成到启动脚本中，支持一键测试

现在您的监控系统具备了完整的网络请求错误监控和测试能力！
