import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

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
  ],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
})
export class AppHeader {
  readonly store = inject(DashboardStore);

  private readonly dialog = inject(MatDialog);

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
