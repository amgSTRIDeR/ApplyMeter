import { buildActivityChartData } from './dashboard.aggregations';
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
