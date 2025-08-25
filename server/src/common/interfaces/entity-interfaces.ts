/**
 * 实体接口定义
 * 用于打破实体间的循环依赖
 */

export interface IAlertRule {
  id: number;
  name: string;
  type: string;
  condition: string;
  threshold: number;
  timeWindow: number;
  enabled: boolean;
  projectId: string;
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

/**
 * 实体关系接口
 */
export interface IAlertRuleWithRelations extends IAlertRule {
  project?: IProjectConfig;
  alertHistories?: IAlertHistory[];
}

export interface IAlertHistoryWithRelations extends IAlertHistory {
  alertRule?: IAlertRule;
  projectConfig?: IProjectConfig;
}

export interface IProjectConfigWithRelations extends IProjectConfig {
  alertRules?: IAlertRule[];
  alertHistories?: IAlertHistory[];
}