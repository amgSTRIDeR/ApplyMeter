import { Component, inject } from '@angular/core';

import { DashboardStore } from '../dashboard.store';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  readonly store = inject(DashboardStore);
}
