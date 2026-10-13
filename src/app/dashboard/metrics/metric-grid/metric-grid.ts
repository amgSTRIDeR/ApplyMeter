import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';

import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
} from '@angular/cdk/drag-drop';

import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';

import { DashboardStore } from '../../dashboard.store';
import type { Metric } from '../../dashboard.models';

import { MetricCard } from '../metric-card/metric-card';

import {
  MetricEditor,
  type MetricEditorResult,
} from '../metric-editor/metric-editor';

@Component({
  selector: 'app-metric-grid',
  imports: [
    MetricCard,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './metric-grid.html',
  styleUrl: './metric-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricGrid {
  readonly store = inject(DashboardStore);

  private readonly dialog = inject(MatDialog);

  readonly metricToDelete = signal<Metric | null>(null);

  readonly deleteConfirmation =
    viewChild.required<TemplateRef<unknown>>('deleteConfirmation');

  onDrop(event: CdkDragDrop<unknown>): void {
    this.store.reorderMetrics(
      event.previousIndex,
      event.currentIndex,
    );
  }

  editMetric(metric: Metric): void {
    const dialogRef = this.dialog.open<
      MetricEditor,
      Metric,
      MetricEditorResult
    >(MetricEditor, {
      width: '380px',
      data: metric,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.updateMetric(metric.id, result);
      }
    });
  }

  deleteMetric(metric: Metric): void {
    this.metricToDelete.set(metric);

    const dialogRef = this.dialog.open(
      this.deleteConfirmation(),
      {
        width: '380px',
      },
    );

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed === true) {
        this.store.archiveMetric(metric.id);
      }

      this.metricToDelete.set(null);
    });
  }
}
