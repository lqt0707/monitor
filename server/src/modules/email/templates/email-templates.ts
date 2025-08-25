/**
 * 邮件模板服务
 * 提供各种邮件模板的生成功能
 */
export class EmailTemplates {
  /**
   * 生成错误告警邮件HTML模板
   * @param data 模板数据
   * @returns HTML内容
   */
  static generateErrorAlertTemplate(data: {
    projectName: string;
    errorLevel: number;
    errorType: string;
    errorMessage: string;
    firstSeen: Date;
    lastSeen: Date;
    occurrenceCount: number;
    affectedUsers: number;
    sourceFile?: string;
    sourceLine?: number;
    sourceColumn?: number;
    aiDiagnosis?: string;
    errorStack?: string;
    triggeredRules?: any[];
  }): string {
    const errorLevelText = this.getErrorLevelText(data.errorLevel);
    const errorLevelColor = this.getErrorLevelColor(data.errorLevel);
    
    let sourceInfo = '';
    if (data.sourceFile) {
      sourceInfo = `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">源文件位置:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${data.sourceFile}:${data.sourceLine || '?'}:${data.sourceColumn || '?'}
          </td>
        </tr>
      `;
    }

    let aiDiagnosis = '';
    if (data.aiDiagnosis) {
      aiDiagnosis = `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">AI诊断:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.aiDiagnosis}</td>
        </tr>
      `;
    }

    let stackTrace = '';
    if (data.errorStack) {
      stackTrace = `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">错误堆栈:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; white-space: pre-wrap;">${data.errorStack}</pre>
          </td>
        </tr>
      `;
    }

    let triggeredRulesInfo = '';
    if (data.triggeredRules && data.triggeredRules.length > 0) {
      const rulesHtml = data.triggeredRules.map(rule => `
        <div style="margin-bottom: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border-left: 4px solid #007bff;">
          <strong>${rule.name}</strong> (${rule.type})
          <br>
          <small>条件: ${rule.condition} ${rule.threshold} (${rule.timeWindow}分钟窗口)</small>
        </div>
      `).join('');
      
      triggeredRulesInfo = `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">触发告警规则:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${rulesHtml}
          </td>
        </tr>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>错误告警 - ${data.projectName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            background-color: #f8f9fa;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            padding: 30px 20px;
            background: linear-gradient(135deg, ${errorLevelColor} 0%, ${this.darkenColor(errorLevelColor, 20)} 100%);
            color: white;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 30px 20px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .info-table td {
            padding: 12px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: top;
          }
          .info-table td:first-child {
            font-weight: 600;
            color: #495057;
            width: 150px;
          }
          .level-badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: ${errorLevelColor};
            color: white;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .footer {
            padding: 20px;
            background-color: #f8f9fa;
            border-top: 1px solid #e9ecef;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
          }
          pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 12px;
            white-space: pre-wrap;
            border-left: 4px solid ${errorLevelColor};
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 错误告警</h1>
            <p>${data.projectName} 检测到${errorLevelText}错误</p>
          </div>
          
          <div class="content">
            <table class="info-table">
              <tr>
                <td>错误级别:</td>
                <td><span class="level-badge">${errorLevelText}</span></td>
              </tr>
              <tr>
                <td>错误类型:</td>
                <td>${data.errorType}</td>
              </tr>
              <tr>
                <td>错误消息:</td>
                <td><strong>${data.errorMessage}</strong></td>
              </tr>
              <tr>
                <td>首次出现:</td>
                <td>${data.firstSeen.toLocaleString('zh-CN')}</td>
              </tr>
              <tr>
                <td>最后出现:</td>
                <td>${data.lastSeen.toLocaleString('zh-CN')}</td>
              </tr>
              <tr>
                <td>出现次数:</td>
                <td>${data.occurrenceCount} 次</td>
              </tr>
              <tr>
                <td>影响用户:</td>
                <td>${data.affectedUsers} 人</td>
              </tr>
              ${sourceInfo}
              ${aiDiagnosis}
              ${stackTrace}
              ${triggeredRulesInfo}
            </table>
          </div>
          
          <div class="footer">
            <p>此邮件由监控系统自动发送，请及时处理相关错误。</p>
            <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 生成错误摘要邮件HTML模板
   * @param data 模板数据
   * @returns HTML内容
   */
  static generateErrorSummaryTemplate(data: {
    projectName: string;
    totalErrors: number;
    newErrors: number;
    resolvedErrors: number;
    topErrors?: Array<{
      errorLevel: number;
      type: string;
      errorMessage: string;
      occurrenceCount: number;
      affectedUsers: number;
    }>;
    timeRange?: string;
  }): string {
    const { projectName, totalErrors, newErrors, resolvedErrors, topErrors = [], timeRange = '过去24小时' } = data;
    
    let topErrorsHtml = '';
    if (topErrors.length > 0) {
      const errorRows = topErrors.map((error, index) => {
        const levelText = this.getErrorLevelText(error.errorLevel);
        const levelColor = this.getErrorLevelColor(error.errorLevel);
        
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e9ecef; text-align: center;">${index + 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e9ecef;">
              <span style="display: inline-block; padding: 2px 8px; background-color: ${levelColor}; color: white; border-radius: 12px; font-size: 11px; font-weight: 600;">
                ${levelText}
              </span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e9ecef; font-weight: 500;">${error.type}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e9ecef;">
              ${error.errorMessage.length > 80 ? error.errorMessage.substring(0, 80) + '...' : error.errorMessage}
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e9ecef; text-align: center; font-weight: 600;">${error.occurrenceCount}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e9ecef; text-align: center; font-weight: 600;">${error.affectedUsers}</td>
          </tr>
        `;
      }).join('');
      
      topErrorsHtml = `
        <div style="margin-top: 30px;">
          <h3 style="color: #495057; margin-bottom: 15px; font-size: 18px;">🔥 最常见错误 (Top ${topErrors.length})</h3>
          <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 15px 12px; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">#</th>
                <th style="padding: 15px 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">级别</th>
                <th style="padding: 15px 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">类型</th>
                <th style="padding: 15px 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">错误消息</th>
                <th style="padding: 15px 12px; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">次数</th>
                <th style="padding: 15px 12px; text-align: center; border-bottom: 2px solid #dee2e6; font-weight: 600; color: #495057;">用户数</th>
              </tr>
            </thead>
            <tbody>
              ${errorRows}
            </tbody>
          </table>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>错误摘要报告 - ${projectName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            background-color: #f8f9fa;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            padding: 30px 20px;
            background: linear-gradient(135deg, #4a6ee0 0%, #3b5bdb 100%);
            color: white;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .header p {
            margin: 10px 0 0;
            opacity: 0.9;
            font-size: 16px;
          }
          .content {
            padding: 30px 20px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .stat-card.total {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-left: 4px solid #6c757d;
          }
          .stat-card.new {
            background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
            border-left: 4px solid #e53e3e;
          }
          .stat-card.resolved {
            background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
            border-left: 4px solid #38a169;
          }
          .stat-number {
            font-size: 32px;
            font-weight: 700;
            margin: 0;
            line-height: 1;
          }
          .stat-label {
            margin: 8px 0 0;
            font-size: 14px;
            font-weight: 500;
            opacity: 0.8;
          }
          .footer {
            padding: 20px;
            background-color: #f8f9fa;
            border-top: 1px solid #e9ecef;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 错误摘要报告</h1>
            <p>${projectName} - ${timeRange}的错误统计</p>
          </div>
          
          <div class="content">
            <div class="stats-grid">
              <div class="stat-card total">
                <h2 class="stat-number" style="color: #6c757d;">${totalErrors}</h2>
                <p class="stat-label">总错误数</p>
              </div>
              <div class="stat-card new">
                <h2 class="stat-number" style="color: #e53e3e;">${newErrors}</h2>
                <p class="stat-label">新增错误</p>
              </div>
              <div class="stat-card resolved">
                <h2 class="stat-number" style="color: #38a169;">${resolvedErrors}</h2>
                <p class="stat-label">已解决错误</p>
              </div>
            </div>
            
            ${topErrorsHtml}
          </div>
          
          <div class="footer">
            <p>此邮件由监控系统自动发送，用于帮助您了解项目的错误趋势。</p>
            <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 生成测试邮件HTML模板
   * @param data 模板数据
   * @returns HTML内容
   */
  static generateTestEmailTemplate(data: {
    projectName: string;
    testMessage: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>测试邮件 - ${data.projectName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8f9fa;
          }
          .container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            padding: 30px 20px;
            background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
            color: white;
            text-align: center;
          }
          .content {
            padding: 30px 20px;
            text-align: center;
          }
          .footer {
            padding: 20px;
            background-color: #f8f9fa;
            border-top: 1px solid #e9ecef;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ 测试邮件</h1>
            <p>${data.projectName} 邮件服务测试</p>
          </div>
          
          <div class="content">
            <h2>邮件服务正常工作！</h2>
            <p>${data.testMessage}</p>
            <p>如果您收到这封邮件，说明邮件配置已正确设置。</p>
          </div>
          
          <div class="footer">
            <p>此邮件由监控系统自动发送，用于测试邮件服务功能。</p>
            <p>发送时间: ${new Date().toLocaleString('zh-CN')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 获取错误级别文本
   * @param level 错误级别
   * @returns 级别文本
   */
  private static getErrorLevelText(level: number): string {
    const levels = {
      1: '低级',
      2: '中级', 
      3: '高级',
      4: '严重',
      5: '致命'
    };
    return levels[level] || '未知';
  }

  /**
   * 获取错误级别颜色
   * @param level 错误级别
   * @returns 颜色值
   */
  private static getErrorLevelColor(level: number): string {
    const colors = {
      1: '#28a745', // 绿色
      2: '#ffc107', // 黄色
      3: '#fd7e14', // 橙色
      4: '#dc3545', // 红色
      5: '#6f42c1'  // 紫色
    };
    return colors[level] || '#6c757d';
  }

  /**
   * 加深颜色
   * @param color 原始颜色
   * @param percent 加深百分比
   * @returns 加深后的颜色
   */
  private static darkenColor(color: string, percent: number): string {
    // 简单的颜色加深实现
    const colorMap = {
      '#28a745': '#1e7e34',
      '#ffc107': '#e0a800',
      '#fd7e14': '#e8650e',
      '#dc3545': '#c82333',
      '#6f42c1': '#5a32a3',
      '#6c757d': '#545b62'
    };
    return colorMap[color] || color;
  }
}