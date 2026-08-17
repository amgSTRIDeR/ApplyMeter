import {
  Conversion,
  DashboardConfig,
  Metric,
  PersistedAppState,
} from './dashboard.models';

export const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_METRICS: Metric[] = [
  {
    id: 'applications',
    name: 'Applications',
    icon: 'send',
    color: '#7657e8',
    archived: false,
  },
  {
    id: 'interviews',
    name: 'Interviews',
    icon: 'groups',
    color: '#4f7cff',
    archived: false,
  },
  {
    id: 'offers',
    name: 'Offers',
    icon: 'work',
    color: '#27a36a',
    archived: false,
  },
  {
    id: 'rejections',
    name: 'Rejections',
    icon: 'close',
    color: '#dc5a5a',
    archived: false,
  },
];

export const DEFAULT_CONVERSIONS: Conversion[] = [
  {
    id: 'applications-to-interviews',
    fromMetricId: 'applications',
    toMetricId: 'interviews',
  },
  {
    id: 'interviews-to-offers',
    fromMetricId: 'interviews',
    toMetricId: 'offers',
  },
];

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  metricOrder: [
    'applications',
    'interviews',
    'offers',
    'rejections',
  ],
  chartMetricIds: [
    'applications',
    'interviews',
  ],
  conversionOrder: [
    'applications-to-interviews',
    'interviews-to-offers',
  ],
  period: 'all',
};

export function createDefaultAppState(): PersistedAppState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    metrics: DEFAULT_METRICS.map((metric) => ({ ...metric })),
    events: [],
    conversions: DEFAULT_CONVERSIONS.map((conversion) => ({
      ...conversion,
    })),
    dashboardConfig: {
      ...DEFAULT_DASHBOARD_CONFIG,
      metricOrder: [...DEFAULT_DASHBOARD_CONFIG.metricOrder],
      chartMetricIds: [...DEFAULT_DASHBOARD_CONFIG.chartMetricIds],
      conversionOrder: [...DEFAULT_DASHBOARD_CONFIG.conversionOrder],
    },
  };
}
