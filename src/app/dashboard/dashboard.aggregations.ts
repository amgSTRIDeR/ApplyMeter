import type {
  ChartMarker,
  DashboardPeriod,
  Metric,
  MetricEvent,
  MetricId,
} from './dashboard.models';
import { parseLocalDate } from './date-utils';

export function buildActivityChartData(
  metrics: Metric[],
  events: MetricEvent[],
  selectedIds: MetricId[],
  chartMarkers: ChartMarker[] = [],
  period: DashboardPeriod = 'all',
) {
  const selectedMetrics = selectedIds
    .map((id) => metrics.find((metric) => metric.id === id))
    .filter((metric): metric is Metric => !!metric && !metric.archived);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const periodDays: Record<DashboardPeriod, number | null> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    all: null,
  };
  const visibleDayCount = periodDays[period] ?? 7;
  const firstDay = new Date(today);
  firstDay.setDate(firstDay.getDate() - visibleDayCount + 1);

  if (period === 'all') {
    for (const event of events) {
      const date = new Date(event.createdAt);
      date.setHours(0, 0, 0, 0);

      if (date < firstDay) {
        firstDay.setTime(date.getTime());
      }
    }

    for (const marker of chartMarkers) {
      const date = parseLocalDate(marker.date);

      if (date && date < firstDay) {
        firstDay.setTime(date.getTime());
      }
    }
  }

  const dates: string[] = [];

  for (
    const date = new Date(firstDay);
    date <= today;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(
      [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
      ].join('-'),
    );
  }

  const dailyTotals = new Map<string, Map<MetricId, number>>();

  for (const event of events) {
    const date = new Date(event.createdAt);

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');

    if (!dailyTotals.has(key)) {
      dailyTotals.set(key, new Map());
    }

    const totals = dailyTotals.get(key)!;

    totals.set(
      event.metricId,
      (totals.get(event.metricId) ?? 0) + event.delta,
    );
  }

  return {
    labels: dates,

    series: selectedMetrics.map((metric) => ({
      id: metric.id,
      name: metric.name,
      color: metric.color,
      values: dates.map(
        (date) => dailyTotals.get(date)?.get(metric.id) ?? 0,
      ),
    })),
  };
}

export function normalizeChartSeries(values: number[]): number[] {
  const maximumMagnitude = values.reduce(
    (maximum, value) => Math.max(maximum, Math.abs(value)),
    0,
  );

  if (maximumMagnitude === 0) {
    return values.map(() => 0);
  }

  return values.map(
    (value) => Math.round((value / maximumMagnitude) * 1000) / 10,
  );
}
