import {
  buildActivityChartData,
  buildMetricTotals,
  normalizeChartSeries,
} from './dashboard.aggregations';
import { DEFAULT_METRICS } from './dashboard.defaults';

describe('buildActivityChartData', () => {
  it('includes earlier marker dates in the chart timeline', () => {
    const result = buildActivityChartData(
      DEFAULT_METRICS,
      [],
      ['applications'],
      [{
        id: 'cv-update',
        date: '2020-01-02',
        description: 'Updated CV',
      }],
    );

    expect(result.labels[0]).toBe('2020-01-02');
    expect(result.labels.length).toBeGreaterThan(7);
  });

  it('limits chart data to the selected number of days', () => {
    const periods = [
      ['7d', 7],
      ['30d', 30],
      ['90d', 90],
    ] as const;

    for (const [period, expectedDays] of periods) {
      const result = buildActivityChartData(
        DEFAULT_METRICS,
        [{
          id: 'old-event',
          metricId: 'applications',
          delta: 3,
          createdAt: '2020-01-02T12:00:00',
        }],
        ['applications'],
        [{
          id: 'old-marker',
          date: '2020-01-02',
          description: 'Updated CV',
        }],
        period,
      );

      expect(result.labels).toHaveLength(expectedDays);
      expect(result.labels[0]).not.toBe('2020-01-02');
    }
  });
});

describe('normalizeChartSeries', () => {
  it('scales each series independently and preserves negative direction', () => {
    expect(normalizeChartSeries([10, 20])).toEqual([50, 100]);
    expect(normalizeChartSeries([100, 200])).toEqual([50, 100]);
    expect(normalizeChartSeries([0, -5, 10])).toEqual([0, -50, 100]);
  });

  it('keeps an empty activity series at zero', () => {
    expect(normalizeChartSeries([0, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe('buildMetricTotals', () => {
  it('sums only events within the selected period', () => {
    const metrics = [DEFAULT_METRICS[0]];
    const events = [
      {
        id: 'inside-period',
        metricId: 'applications',
        delta: 2,
        createdAt: '2026-01-04T12:00:00',
      },
      {
        id: 'outside-period',
        metricId: 'applications',
        delta: 3,
        createdAt: '2026-01-03T12:00:00',
      },
    ];

    const referenceDate = new Date(2026, 0, 10, 12);
    const totals = buildMetricTotals(
      metrics,
      events,
      '7d',
      referenceDate,
    );
    const allTimeTotals = buildMetricTotals(
      metrics,
      events,
      'all',
      referenceDate,
    );

    expect(totals.get('applications')).toBe(2);
    expect(allTimeTotals.get('applications')).toBe(5);
  });
});
