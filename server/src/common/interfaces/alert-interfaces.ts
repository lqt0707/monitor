/**
 * 告警相关接口定义
 * 用于打破实体间的循环依赖
 */

export interface IAlertRule {
  id: number;
  name: string;
  type: string;
  description?: string;
  condition: string;
  threshold: number;
  timeWindow: number;
  actions: string[];
  webhookUrl?: string;
  enabled: boolean;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectConfig {
  id: number;
  projectId: string;
  name: string;
  description?: string;
  apiKey: string;
  alertEmail?: string;
  alertLevel: number;
  enableAiDiagnosis: boolean;
  enableErrorAggregation: boolean;
  enableSourcemap: boolean;
  sourcemapPath?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAlertHistory {
  id: number;
  alertRuleId: number;
  projectConfigId: number;
  type: string;
  name: string;
  triggeredValue: number;
  threshold: number;
  timeWindow: number;
  alertMessage: string;
  errorMessage?: string;
  errorLevel?: number;
  status: string;
  createdAt: Date;
}