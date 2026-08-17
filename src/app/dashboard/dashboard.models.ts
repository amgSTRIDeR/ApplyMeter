export type MetricId = string;
export type MetricEventId = string;
export type ConversionId = string;

export interface Metric {
  id: MetricId;
  name: string;
  icon: string;
  color: string;
  archived: boolean;
}

export interface MetricEvent {
  id: MetricEventId;
  metricId: MetricId;
  delta: number;
  createdAt: string;
}

export interface Conversion {
  id: ConversionId;
  fromMetricId: MetricId;
  toMetricId: MetricId;
}

export type DashboardPeriod = 'all';

export interface DashboardConfig {
  metricOrder: MetricId[];
  chartMetricIds: MetricId[];
  conversionOrder: ConversionId[];
  period: DashboardPeriod;
}

export interface PersistedAppState {
  schemaVersion: number;
  metrics: Metric[];
  events: MetricEvent[];
  conversions: Conversion[];
  dashboardConfig: DashboardConfig;
}
