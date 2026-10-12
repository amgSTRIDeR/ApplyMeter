import { computed, inject, Injectable, signal } from '@angular/core';

import { ChromeStorage } from '../persistence/chrome-storage';
import { createDefaultAppState } from './dashboard.defaults';
import type {
  MetricEvent,
  MetricId,
  PersistedAppState,
} from './dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardStore {
  private readonly storage = inject(ChromeStorage);

  private readonly state = signal<PersistedAppState>(
    createDefaultAppState(),
  );

  readonly isLoading = signal(true);
  readonly loadError = signal(false);
  readonly saveError = signal(false);

  readonly metrics = computed(() => {
    const state = this.state();

    const order = new Map(
      state.dashboardConfig.metricOrder.map(
        (id, index) => [id, index] as const,
      ),
    );

    return state.metrics
      .filter((metric) => !metric.archived)
      .sort(
        (a, b) =>
          (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(b.id) ?? Number.MAX_SAFE_INTEGER),
      );
  });

  readonly metricTotals = computed(() => {
    const { metrics, events } = this.state();

    const totals = new Map<MetricId, number>();

    for (const metric of metrics) {
      totals.set(metric.id, 0);
    }

    for (const event of events) {
      const current = totals.get(event.metricId);

      if (current !== undefined) {
        totals.set(event.metricId, current + event.delta);
      }
    }

    return totals;
  });

  private saveQueue: Promise<void> = Promise.resolve();

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const state = await this.storage.load();

      this.state.set(state);
    } catch {
      this.loadError.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  incrementMetric(metricId: MetricId): void {
    this.changeMetric(metricId, 1);
  }

  decrementMetric(metricId: MetricId): void {
    this.changeMetric(metricId, -1);
  }

  private changeMetric(metricId: MetricId, delta: number): void {
    if (this.isLoading() || this.loadError()) {
      return;
    }

    const metric = this.state().metrics.find(
      (item) => item.id === metricId && !item.archived,
    );

    if (!metric) {
      return;
    }

    const currentValue = this.metricTotals().get(metricId) ?? 0;

    if (currentValue + delta < 0) {
      return;
    }

    const event: MetricEvent = {
      id: crypto.randomUUID(),
      metricId,
      delta,
      createdAt: new Date().toISOString(),
    };

    this.state.update((state) => ({
      ...state,
      events: [...state.events, event],
    }));

    this.persist();
  }

  private persist(): void {
    const snapshot = this.state();

    this.saveQueue = this.saveQueue
      .then(() => this.storage.save(snapshot))
      .then(() => {
        this.saveError.set(false);
      })
      .catch(() => {
        this.saveError.set(true);
      });
  }
}
