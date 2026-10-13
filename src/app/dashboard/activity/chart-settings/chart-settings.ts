import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

import type {
  Metric,
  MetricId,
} from '../../dashboard.models';

export interface ChartSettingsData {
  metrics: Metric[];
  selectedIds: MetricId[];
}

@Component({
  selector: 'app-chart-settings',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
  ],
  templateUrl: './chart-settings.html',
  styleUrl: './chart-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartSettings {
  readonly data = inject<ChartSettingsData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject<
    MatDialogRef<ChartSettings, MetricId[]>
  >(MatDialogRef);

  readonly selectedIds = signal<MetricId[]>(
    [...this.data.selectedIds],
  );

  toggleMetric(metricId: MetricId, checked: boolean): void {
    this.selectedIds.update((ids) =>
      checked
        ? [...new Set([...ids, metricId])]
        : ids.filter((id) => id !== metricId),
    );
  }

  save(): void {
    const selectedIds = this.data.metrics
      .map((metric) => metric.id)
      .filter((id) => this.selectedIds().includes(id));

    this.dialogRef.close(selectedIds);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
