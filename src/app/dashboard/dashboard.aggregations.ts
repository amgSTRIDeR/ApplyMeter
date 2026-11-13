import type {
  ChartMarker,
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
) {
  const selectedMetrics = selectedIds
    .map((id) => metrics.find((metric) => metric.id === id))
    .filter((metric): metric is Metric => !!metric && !metric.archived);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(today);
  firstDay.setDate(firstDay.getDate() - 6);

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
