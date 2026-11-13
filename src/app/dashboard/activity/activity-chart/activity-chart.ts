import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  viewChild,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import Chart from 'chart.js/auto';
import type { ChartDataset, Plugin } from 'chart.js';

import { DashboardStore } from '../../dashboard.store';
import type { MetricId } from '../../dashboard.models';

import {
  ChartSettings,
  type ChartSettingsData,
} from '../chart-settings/chart-settings';
import {
  ChartMarkerEditor,
  type ChartMarkerEditorResult,
} from '../chart-marker-editor/chart-marker-editor';

const chartMarkerLines: Plugin<'line'> = {
  id: 'chartMarkerLines',
  beforeDatasetsDraw(chart) {
    const markerDatasets = chart.data.datasets.filter(
      (dataset) => dataset.yAxisID === 'yMarkers',
    );
    const xScale = chart.scales['x'];
    const { top, bottom } = chart.chartArea;
    const positions = new Set<number>();
    const { ctx } = chart;

    for (const dataset of markerDatasets) {
      dataset.data.forEach((value, index) => {
        if (value !== null) {
          positions.add(xScale.getPixelForValue(index));
        }
      });
    }

    ctx.save();
    ctx.strokeStyle = '#d49b28';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (const x of positions) {
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }

    ctx.restore();
  },
};

@Component({
  selector: 'app-activity-chart',
  imports: [MatButtonModule],
  templateUrl: './activity-chart.html',
  styleUrl: './activity-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityChart implements OnDestroy {
  readonly store = inject(DashboardStore);

  private readonly dialog = inject(MatDialog);

  private readonly canvas =
    viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  private chart?: Chart<'line', (number | null)[], string>;

  constructor() {
    effect(() => {
      const canvas = this.canvas()?.nativeElement;
      const { labels, series } = this.store.chartData();
      const markers = this.store.chartMarkers();

      if (!canvas) {
        return;
      }

      const datasets = series.map((metric) => ({
        label: metric.name,
        data: metric.values,
        borderColor: metric.color,
        backgroundColor: metric.color,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5,
        fill: false,
      }));

      const markersOnDates = new Map<string, number>();
      const markerDatasets = markers.map((marker) => {
        const sameDateCount = markersOnDates.get(marker.date) ?? 0;
        markersOnDates.set(marker.date, sameDateCount + 1);

        return {
          label: marker.description,
          data: labels.map((date) =>
            date === marker.date
              ? Math.max(0.1, 0.9 - sameDateCount * 0.08)
              : null,
          ),
          yAxisID: 'yMarkers',
          borderColor: '#d49b28',
          backgroundColor: '#d49b28',
          showLine: false,
          pointStyle: 'rectRot' as const,
          pointRadius: 5,
          pointHoverRadius: 7,
        };
      });
      const allDatasets: ChartDataset<
        'line',
        (number | null)[]
      >[] = [...datasets, ...markerDatasets];

      if (!this.chart) {
        this.chart = new Chart<'line', (number | null)[], string>(canvas, {
          type: 'line',
          data: {
            labels,
            datasets: allDatasets,
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: (context) =>
                    context.dataset.yAxisID === 'yMarkers'
                      ? context.dataset.label ?? ''
                      : `${context.dataset.label}: ${context.formattedValue}`,
                },
              },
            },
            scales: {
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  autoSkip: true,
                  maxTicksLimit: 6,
                },
              },
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0,
                },
              },
              yMarkers: {
                type: 'linear',
                axis: 'y',
                display: false,
                min: 0,
                max: 1,
                grid: {
                  drawOnChartArea: false,
                },
              },
            },
          },
          plugins: [chartMarkerLines],
        });
      } else {
        this.chart.data.labels = labels;
        this.chart.data.datasets = allDatasets;
        this.chart.update('none');
      }
    });
  }

  openSettings(): void {
    const dialogRef = this.dialog.open<
      ChartSettings,
      ChartSettingsData,
      MetricId[]
    >(ChartSettings, {
      width: '360px',
      data: {
        metrics: this.store.metrics(),
        selectedIds: this.store.chartMetricIds(),
      },
    });

    dialogRef.afterClosed().subscribe((selectedIds) => {
      if (selectedIds) {
        this.store.setChartMetrics(selectedIds);
      }
    });
  }

  addMarker(): void {
    const dialogRef = this.dialog.open<
      ChartMarkerEditor,
      undefined,
      ChartMarkerEditorResult
    >(ChartMarkerEditor, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((marker) => {
      if (marker) {
        this.store.addChartMarker(marker);
      }
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
