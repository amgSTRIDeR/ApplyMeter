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

export interface ChartMarker {
  id: string;
  date: string;
  description: string;
  color?: string;
}

export type ChartMarkerData = Pick<
  ChartMarker,
  'date' | 'description'
> & {
  color: string;
};

export interface Conversion {
  id: ConversionId;
  fromMetricId: MetricId;
  toMetricId: MetricId;
}

export type DashboardPeriod = '7d' | '30d' | '90d' | 'all';

export function isDashboardPeriod(value: unknown): value is DashboardPeriod {
  return (
    value === '7d' ||
    value === '30d' ||
    value === '90d' ||
    value === 'all'
  );
}

export interface DashboardConfig {
  metricOrder: MetricId[];
  chartMetricIds: MetricId[];
  conversionOrder: ConversionId[];
  period: DashboardPeriod;
  metricsPeriod?: DashboardPeriod;
}

export interface PersistedAppState {
  schemaVersion: number;
  metrics: Metric[];
  events: MetricEvent[];
  chartMarkers?: ChartMarker[];
  conversions: Conversion[];
  dashboardConfig: DashboardConfig;
}
