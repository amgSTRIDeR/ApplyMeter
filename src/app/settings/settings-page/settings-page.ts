import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';

import { CURRENT_SCHEMA_VERSION } from '../../dashboard/dashboard.defaults';
import { parseLocalDate } from '../../dashboard/date-utils';
import { DashboardStore } from '../../dashboard/dashboard.store';
import type { PersistedAppState } from '../../dashboard/dashboard.models';

@Component({
  selector: 'app-settings-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  readonly store = inject(DashboardStore);

  private readonly dialog = inject(MatDialog);

  private readonly confirmation =
    viewChild.required<TemplateRef<unknown>>('confirmImport');

  readonly isImporting = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  exportData(): void {
    try {
      const data = this.store.exportData();

      const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: 'application/json' },
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'applymeter-backup.json';

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => URL.revokeObjectURL(url), 1000);

      this.errorMessage.set('');
      this.successMessage.set('');
    } catch {
      this.errorMessage.set('Failed to export data.');
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    input.value = '';

    if (!file || this.isImporting()) {
      return;
    }

    this.isImporting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const content = await file.text();
      const data: unknown = JSON.parse(content);

      if (!isValidBackup(data)) {
        throw new Error('Invalid or unsupported backup file.');
      }

      const confirmed = await firstValueFrom(
        this.dialog.open(this.confirmation(), {
          width: '420px',
        }).afterClosed(),
      );

      if (confirmed !== true) {
        return;
      }

      await this.store.importData(data);

      this.successMessage.set('Data imported successfully.');
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Failed to import data.',
      );
    } finally {
      this.isImporting.set(false);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isUniqueStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) => typeof item === 'string' && item.length > 0,
    ) &&
    new Set(value).size === value.length
  );
}

function isValidBackup(value: unknown): value is PersistedAppState {
  if (!isRecord(value)) {
    return false;
  }

  const metrics = value['metrics'];
  const events = value['events'];
  const chartMarkers = value['chartMarkers'];
  const conversions = value['conversions'];
  const config = value['dashboardConfig'];

  if (
    value['schemaVersion'] !== CURRENT_SCHEMA_VERSION ||
    !Array.isArray(metrics) ||
    !Array.isArray(events) ||
    (chartMarkers !== undefined && !Array.isArray(chartMarkers)) ||
    !Array.isArray(conversions) ||
    !isRecord(config)
  ) {
    return false;
  }

  const metricIds = new Set<string>();
  const activeIds = new Set<string>();

  for (const metric of metrics as unknown[]) {
    if (
      !isRecord(metric) ||
      typeof metric['id'] !== 'string' ||
      metric['id'].length === 0 ||
      typeof metric['name'] !== 'string' ||
      metric['name'].trim().length === 0 ||
      metric['name'].length > 40 ||
      typeof metric['icon'] !== 'string' ||
      metric['icon'].length === 0 ||
      typeof metric['color'] !== 'string' ||
      !/^#[0-9a-fA-F]{6}$/.test(metric['color']) ||
      typeof metric['archived'] !== 'boolean'
    ) {
      return false;
    }

    const id = metric['id'];

    if (metricIds.has(id)) {
      return false;
    }

    metricIds.add(id);

    if (!metric['archived']) {
      activeIds.add(id);
    }
  }

  const eventIds = new Set<string>();

  for (const event of events as unknown[]) {
    if (
      !isRecord(event) ||
      typeof event['id'] !== 'string' ||
      event['id'].length === 0 ||
      typeof event['metricId'] !== 'string' ||
      !metricIds.has(event['metricId']) ||
      typeof event['delta'] !== 'number' ||
      !Number.isSafeInteger(event['delta']) ||
      event['delta'] === 0 ||
      typeof event['createdAt'] !== 'string' ||
      !Number.isFinite(Date.parse(event['createdAt']))
    ) {
      return false;
    }

    if (eventIds.has(event['id'])) {
      return false;
    }

    eventIds.add(event['id']);
  }

  const chartMarkerIds = new Set<string>();

  for (const marker of (chartMarkers ?? []) as unknown[]) {
    if (
      !isRecord(marker) ||
      typeof marker['id'] !== 'string' ||
      marker['id'].length === 0 ||
      typeof marker['date'] !== 'string' ||
      !parseLocalDate(marker['date']) ||
      typeof marker['description'] !== 'string' ||
      marker['description'].trim().length === 0 ||
      marker['description'].length > 120 ||
      (
        marker['color'] !== undefined &&
        (
          typeof marker['color'] !== 'string' ||
          !/^#[0-9a-fA-F]{6}$/.test(marker['color'])
        )
      ) ||
      chartMarkerIds.has(marker['id'])
    ) {
      return false;
    }

    chartMarkerIds.add(marker['id']);
  }

  const conversionIds = new Set<string>();
  const conversionPairs = new Set<string>();

  for (const conversion of conversions as unknown[]) {
    if (
      !isRecord(conversion) ||
      typeof conversion['id'] !== 'string' ||
      conversion['id'].length === 0 ||
      typeof conversion['fromMetricId'] !== 'string' ||
      typeof conversion['toMetricId'] !== 'string' ||
      conversion['fromMetricId'] === conversion['toMetricId'] ||
      !activeIds.has(conversion['fromMetricId']) ||
      !activeIds.has(conversion['toMetricId'])
    ) {
      return false;
    }

    const id = conversion['id'];
    const pair =
      `${conversion['fromMetricId']}\u0000${conversion['toMetricId']}`;

    if (
      conversionIds.has(id) ||
      conversionPairs.has(pair)
    ) {
      return false;
    }

    conversionIds.add(id);
    conversionPairs.add(pair);
  }

  const metricOrder = config['metricOrder'];
  const chartMetricIds = config['chartMetricIds'];
  const conversionOrder = config['conversionOrder'];

  if (
    !isUniqueStringArray(metricOrder) ||
    !isUniqueStringArray(chartMetricIds) ||
    !isUniqueStringArray(conversionOrder)
  ) {
    return false;
  }

  return (
    config['period'] === 'all' &&
    metricOrder.every((id) => metricIds.has(id)) &&
    [...activeIds].every((id) => metricOrder.includes(id)) &&
    chartMetricIds.every((id) => activeIds.has(id)) &&
    conversionOrder.length === conversionIds.size &&
    conversionOrder.every((id) => conversionIds.has(id))
  );
}
