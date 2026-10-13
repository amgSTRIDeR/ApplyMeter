import { computed, inject, Injectable, signal } from '@angular/core';
import { buildActivityChartData } from './dashboard.aggregations';
import { ChromeStorage } from '../persistence/chrome-storage';
import { createDefaultAppState } from './dashboard.defaults';
import type {
  Conversion,
  ConversionId,
  Metric,
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

  readonly chartMetricIds = computed(
    () => this.state().dashboardConfig.chartMetricIds,
  );

  readonly chartData = computed(() => {
    const state = this.state();

    return buildActivityChartData(
      state.metrics,
      state.events,
      state.dashboardConfig.chartMetricIds,
    );
  });

  readonly conversionRows = computed(() => {
    const state = this.state();
    const totals = this.metricTotals();

    const metrics = new Map(
      state.metrics
        .filter((metric) => !metric.archived)
        .map((metric) => [metric.id, metric] as const),
    );

    const order = new Map(
      state.dashboardConfig.conversionOrder.map(
        (id, index) => [id, index] as const,
      ),
    );

    return state.conversions
      .filter(
        (conversion) =>
          metrics.has(conversion.fromMetricId) &&
          metrics.has(conversion.toMetricId),
      )
      .sort(
        (a, b) =>
          (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(b.id) ?? Number.MAX_SAFE_INTEGER),
      )
      .map((conversion) => {
        const fromMetric = metrics.get(conversion.fromMetricId)!;
        const toMetric = metrics.get(conversion.toMetricId)!;

        const fromValue = totals.get(conversion.fromMetricId) ?? 0;
        const toValue = totals.get(conversion.toMetricId) ?? 0;

        return {
          ...conversion,
          fromName: fromMetric.name,
          toName: toMetric.name,
          fromValue,
          toValue,
          percentage:
            fromValue > 0
              ? Math.round((toValue / fromValue) * 100)
              : null,
        };
      });
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

  reorderMetrics(previousIndex: number, currentIndex: number): void {
    if (this.isLoading() || this.loadError()) {
      return;
    }

    const metricIds = this.metrics().map((metric) => metric.id);

    if (
      previousIndex === currentIndex ||
      previousIndex < 0 ||
      currentIndex < 0 ||
      previousIndex >= metricIds.length ||
      currentIndex >= metricIds.length
    ) {
      return;
    }

    const [movedMetricId] = metricIds.splice(previousIndex, 1);

    metricIds.splice(currentIndex, 0, movedMetricId);

    const visibleIds = new Set(metricIds);

    this.state.update((state) => ({
      ...state,
      dashboardConfig: {
        ...state.dashboardConfig,
        metricOrder: [
          ...metricIds,
          ...state.dashboardConfig.metricOrder.filter(
            (id) => !visibleIds.has(id),
          ),
        ],
      },
    }));

    this.persist();
  }

  addMetric(data: Pick<Metric, 'name' | 'icon' | 'color'>): void {
    if (this.isLoading() || this.loadError()) {
      return;
    }

    const name = data.name.trim();

    if (!name) {
      return;
    }

    const metric: Metric = {
      id: crypto.randomUUID(),
      name,
      icon: data.icon,
      color: data.color,
      archived: false,
    };

    this.state.update((state) => ({
      ...state,
      metrics: [...state.metrics, metric],
      dashboardConfig: {
        ...state.dashboardConfig,
        metricOrder: [
          ...state.dashboardConfig.metricOrder,
          metric.id,
        ],
      },
    }));

    this.persist();
  }

  updateMetric(
    metricId: MetricId,
    data: Pick<Metric, 'name' | 'icon' | 'color'>,
  ): void {
    if (this.isLoading() || this.loadError()) {
      return;
    }

    const name = data.name.trim();

    if (!name) {
      return;
    }

    const metricExists = this.state().metrics.some(
      (metric) => metric.id === metricId && !metric.archived,
    );

    if (!metricExists) {
      return;
    }

    this.state.update((state) => ({
      ...state,
      metrics: state.metrics.map((metric) =>
        metric.id === metricId
          ? {
            ...metric,
            name,
            icon: data.icon,
            color: data.color,
          }
          : metric,
      ),
    }));

    this.persist();
  }

  archiveMetric(metricId: MetricId): void {
    if (this.isLoading() || this.loadError()) {
      return;
    }

    const metricExists = this.state().metrics.some(
      (metric) => metric.id === metricId && !metric.archived,
    );

    if (!metricExists) {
      return;
    }

    this.state.update((state) => {
      const conversions = state.conversions.filter(
        (conversion) =>
          conversion.fromMetricId !== metricId &&
          conversion.toMetricId !== metricId,
      );

      const conversionIds = new Set(
        conversions.map((conversion) => conversion.id),
      );

      return {
        ...state,

        metrics: state.metrics.map((metric) =>
          metric.id === metricId
            ? { ...metric, archived: true }
            : metric,
        ),

        conversions,

        dashboardConfig: {
          ...state.dashboardConfig,

          metricOrder: state.dashboardConfig.metricOrder.filter(
            (id) => id !== metricId,
          ),

          chartMetricIds: state.dashboardConfig.chartMetricIds.filter(
            (id) => id !== metricId,
          ),

          conversionOrder: state.dashboardConfig.conversionOrder.filter(
            (id) => conversionIds.has(id),
          ),
        },
      };
    });

    this.persist();
  }

  addConversion(
    data: Pick<Conversion, 'fromMetricId' | 'toMetricId'>,
  ): void {
    if (
      this.isLoading() ||
      this.loadError() ||
      !this.isValidConversion(data)
    ) {
      return;
    }

    const conversion: Conversion = {
      id: crypto.randomUUID(),
      ...data,
    };

    this.state.update((state) => ({
      ...state,
      conversions: [...state.conversions, conversion],
      dashboardConfig: {
        ...state.dashboardConfig,
        conversionOrder: [
          ...state.dashboardConfig.conversionOrder,
          conversion.id,
        ],
      },
    }));

    this.persist();
  }

  updateConversion(
    conversionId: ConversionId,
    data: Pick<Conversion, 'fromMetricId' | 'toMetricId'>,
  ): void {
    if (
      this.isLoading() ||
      this.loadError() ||
      !this.isValidConversion(data, conversionId)
    ) {
      return;
    }

    const exists = this.state().conversions.some(
      (conversion) => conversion.id === conversionId,
    );

    if (!exists) {
      return;
    }

    this.state.update((state) => ({
      ...state,
      conversions: state.conversions.map((conversion) =>
        conversion.id === conversionId
          ? { ...conversion, ...data }
          : conversion,
      ),
    }));

    this.persist();
  }

  deleteConversion(conversionId: ConversionId): void {
    if (this.isLoading() || this.loadError()) {
      return;
    }

    const exists = this.state().conversions.some(
      (conversion) => conversion.id === conversionId,
    );

    if (!exists) {
      return;
    }

    this.state.update((state) => ({
      ...state,

      conversions: state.conversions.filter(
        (conversion) => conversion.id !== conversionId,
      ),

      dashboardConfig: {
        ...state.dashboardConfig,
        conversionOrder: state.dashboardConfig.conversionOrder.filter(
          (id) => id !== conversionId,
        ),
      },
    }));

    this.persist();
  }

  reorderConversions(
    previousIndex: number,
    currentIndex: number,
  ): void {
    if (this.isLoading() || this.loadError()) {
      return;
    }

    const ids = this.conversionRows().map(
      (conversion) => conversion.id,
    );

    if (
      previousIndex === currentIndex ||
      previousIndex < 0 ||
      currentIndex < 0 ||
      previousIndex >= ids.length ||
      currentIndex >= ids.length
    ) {
      return;
    }

    const [movedId] = ids.splice(previousIndex, 1);

    ids.splice(currentIndex, 0, movedId);

    this.state.update((state) => ({
      ...state,
      dashboardConfig: {
        ...state.dashboardConfig,
        conversionOrder: ids,
      },
    }));

    this.persist();
  }

  private isValidConversion(
    data: Pick<Conversion, 'fromMetricId' | 'toMetricId'>,
    excludedId?: ConversionId,
  ): boolean {
    const state = this.state();

    const activeIds = new Set(
      state.metrics
        .filter((metric) => !metric.archived)
        .map((metric) => metric.id),
    );

    return (
      data.fromMetricId !== data.toMetricId &&
      activeIds.has(data.fromMetricId) &&
      activeIds.has(data.toMetricId) &&
      !state.conversions.some(
        (conversion) =>
          conversion.id !== excludedId &&
          conversion.fromMetricId === data.fromMetricId &&
          conversion.toMetricId === data.toMetricId,
      )
    );
  }

  setChartMetrics(metricIds: MetricId[]): void {
    if (this.isLoading() || this.loadError()) {
      return;
    }

    const activeIds = new Set(
      this.metrics().map((metric) => metric.id),
    );

    const selectedIds = [...new Set(metricIds)].filter(
      (id) => activeIds.has(id),
    );

    this.state.update((state) => ({
      ...state,
      dashboardConfig: {
        ...state.dashboardConfig,
        chartMetricIds: selectedIds,
      },
    }));

    this.persist();
  }

  exportData(): PersistedAppState {
    if (this.isLoading() || this.loadError()) {
      throw new Error('Dashboard is not ready.');
    }

    return structuredClone(this.state());
  }

  async importData(data: PersistedAppState): Promise<void> {
    if (this.isLoading() || this.loadError()) {
      throw new Error('Dashboard is not ready.');
    }

    await this.saveQueue;

    await this.storage.save(data);

    this.state.set(data);
    this.saveError.set(false);
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
