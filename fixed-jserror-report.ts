// 修正后的错误上报数据 - 已修复数据格式问题

// 单条数据上报 (/api/monitor/report) - 使用ReportDataDto格式
{
  "projectId": "taromini",
  "type": "jsError",
  "errorMessage": "TypeError: Cannot read property of undefined",
  "errorStack": "Error stack trace",
  "pageUrl": "/pages/index/index",
  "userAgent": "WeChat/8.0.0",
  "deviceInfo": "{\"model\":\"iPhone 12\",\"system\":\"iOS 15.0\",\"platform\":\"ios\"}",
  "networkInfo": "{\"networkType\":\"wifi\",\"isConnected\":true}",
  "performanceData": "[{\"entryType\":\"script\",\"name\":\"evaluateScript\",\"startTime\":1755836992055,\"duration\":0,\"moduleName\":\"__APP__\",\"fileList\":[\"/app-service.js\"]},{\"entryType\":\"render\",\"name\":\"firstRender\",\"startTime\":1755836992109,\"duration\":27,\"path\":\"pages/index/index\",\"pageId\":4,\"viewLayerReadyTime\":1755836992011,\"initDataSendTime\":1755836992130,\"initDataRecvTime\":1755836992130,\"viewLayerRenderStartTime\":1755836992130,\"viewLayerRenderEndTime\":1755836992136},{\"entryType\":\"render\",\"name\":\"firstPaint\",\"startTime\":1755836992184,\"path\":\"pages/index/index\",\"pageId\":4},{\"entryType\":\"render\",\"name\":\"firstContentfulPaint\",\"startTime\":1755836992184,\"path\":\"pages/index/index\",\"pageId\":4},{\"entryType\":\"render\",\"name\":\"largestContentfulPaint\",\"startTime\":1755836992184,\"path\":\"pages/index/index\",\"pageId\":4}]",
  "extraData": "{\"behavior\":[],\"customData\":{\"test\":\"value\"},\"env\":1,\"sdkVersion\":\"1.0.0-taro\"}"
}

// 批量数据上报 (/api/error-logs/batch) - 使用ErrorLogDto格式
[
  {
    "projectId": "taromini",
    "type": "jsError",
    "errorMessage": "TypeError: Cannot read property of undefined",
    "errorStack": "Error stack trace",
    "pageUrl": "/pages/index/index",
    "userAgent": "WeChat/8.0.0",
    "deviceInfo": {
      "model": "iPhone 12",
      "system": "iOS 15.0",
      "platform": "ios"
    },
    "networkInfo": {
      "networkType": "wifi",
      "isConnected": true
    },
    "breadcrumbs": [
      {
        "timestamp": 1755836992055,
        "type": "user",
        "category": "ui",
        "message": "User clicked button",
        "data": { "buttonId": "submit" }
      }
    ],
    "extraData": {
      "behavior": [],
      "customData": { "test": "value" },
      "env": 1,
      "sdkVersion": "1.0.0-taro",
      "performanceData": [
        {
          "entryType": "script",
          "name": "evaluateScript",
          "startTime": 1755836992055,
          "duration": 0
        }
      ]
    },
    "timestamp": 1755836992055
  }
]

/* 
修复说明：
1. 单条上报使用 /api/monitor/report 接口，数据格式遵循 ReportDataDto
   - deviceInfo、networkInfo、performanceData、extraData 等字段转换为JSON字符串
   
2. 批量上报使用 /api/error-logs/batch 接口，数据格式遵循 ErrorLogDto  
   - deviceInfo、networkInfo、extraData 等字段保持为对象格式
   - behavior 数据转换为 breadcrumbs 格式
   - 添加 timestamp 字段
   
3. 移除了不符合DTO定义的额外字段如：error、behavior、env、customData、time、network、systemInfo、activePage、sdkVersion（作为顶级字段）

4. Reporter类根据端点类型自动选择正确的数据转换格式
*/