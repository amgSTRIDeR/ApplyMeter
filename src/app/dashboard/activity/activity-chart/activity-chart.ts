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

import { DashboardStore } from '../../dashboard.store';
import type { MetricId } from '../../dashboard.models';

import {
  ChartSettings,
  type ChartSettingsData,
} from '../chart-settings/chart-settings';

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

  private chart?: Chart<'line', number[], string>;

  constructor() {
    effect(() => {
      const canvas = this.canvas()?.nativeElement;
      const { labels, series } = this.store.chartData();

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

      if (!this.chart) {
        this.chart = new Chart(canvas, {
          type: 'line',
          data: {
            labels,
            datasets,
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
            },
          },
        });
      } else {
        this.chart.data.labels = labels;
        this.chart.data.datasets = datasets;
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

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
