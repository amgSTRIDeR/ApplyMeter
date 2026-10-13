import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

import type {
  Metric,
  MetricId,
} from '../../dashboard.models';

@Component({
  selector: 'app-metric-card',
  imports: [
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './metric-card.html',
  styleUrl: './metric-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetricCard {
  readonly metric = input.required<Metric>();
  readonly value = input.required<number>();

  readonly increment = output<MetricId>();
  readonly decrement = output<MetricId>();

  readonly edit = output<Metric>();
  readonly remove = output<Metric>();
}
