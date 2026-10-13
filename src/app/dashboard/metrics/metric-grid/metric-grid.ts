import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { DashboardStore } from '../../dashboard.store';
import { MetricCard } from '../metric-card/metric-card';

@Component({
  selector: 'app-metric-grid',
  imports: [MetricCard],
  templateUrl: './metric-grid.html',
  styleUrl: './metric-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricGrid {
  readonly store = inject(DashboardStore);
}
