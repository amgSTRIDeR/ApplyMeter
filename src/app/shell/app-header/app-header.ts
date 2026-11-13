import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';

import type { DashboardPeriod } from '../../dashboard/dashboard.models';

import { DashboardStore } from '../../dashboard/dashboard.store';
import {
  MetricEditor,
  type MetricEditorResult,
} from '../../dashboard/metrics/metric-editor/metric-editor';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
})
export class AppHeader {
  readonly store = inject(DashboardStore);

  private readonly dialog = inject(MatDialog);

  periodLabel(): string {
    const labels: Record<DashboardPeriod, string> = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
      all: 'All time',
    };

    return labels[this.store.metricsPeriod()];
  }

  addMetric(): void {
    const dialogRef = this.dialog.open<
      MetricEditor,
      null,
      MetricEditorResult
    >(MetricEditor, {
      width: '380px',
      data: null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.addMetric(result);
      }
    });
  }
}
