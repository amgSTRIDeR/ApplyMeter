import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
} from '@angular/cdk/drag-drop';

import { DashboardStore } from '../../dashboard.store';
import { MetricCard } from '../metric-card/metric-card';

@Component({
  selector: 'app-metric-grid',
  imports: [
    MetricCard,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
  ],
  templateUrl: './metric-grid.html',
  styleUrl: './metric-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricGrid {
  readonly store = inject(DashboardStore);

  onDrop(event: CdkDragDrop<unknown>): void {
    this.store.reorderMetrics(
      event.previousIndex,
      event.currentIndex,
    );
  }
}
