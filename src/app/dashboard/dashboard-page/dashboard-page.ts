import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { DashboardStore } from '../dashboard.store';
import { MetricGrid } from '../metrics/metric-grid/metric-grid';

@Component({
  selector: 'app-dashboard-page',
  imports: [MetricGrid],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  readonly store = inject(DashboardStore);
}
