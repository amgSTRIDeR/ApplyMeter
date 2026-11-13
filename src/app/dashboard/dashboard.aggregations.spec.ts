import {
  buildActivityChartData,
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
