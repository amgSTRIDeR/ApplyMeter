import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { DashboardStore } from '../dashboard.store';

import { MetricGrid } from '../metrics/metric-grid/metric-grid';
import { ConversionPanel } from '../conversions/conversion-panel/conversion-panel';
import { ActivityChart } from '../activity/activity-chart/activity-chart';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    MetricGrid,
    ActivityChart,
    ConversionPanel,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  readonly store = inject(DashboardStore);
}
