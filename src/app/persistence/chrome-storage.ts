import { Injectable } from '@angular/core';

import {
  createDefaultAppState,
  DEFAULT_CHART_MARKER_COLOR,
} from '../dashboard/dashboard.defaults';
import {
  isBadgePeriod,
  isDashboardPeriod,
  type BadgePeriod,
  type PersistedAppState,
} from '../dashboard/dashboard.models';

const STORAGE_KEY = 'applymeter.state';
const TOOLBAR_ACTION_KEY = 'applymeter.toolbarAction';
const HOTKEY_METRIC_KEY = 'applymeter.hotkeyMetricId';
const BADGE_METRIC_KEY = 'applymeter.badgeMetricId';
const BADGE_PERIOD_KEY = 'applymeter.badgePeriod';

export type ToolbarAction = 'open-widget' | 'increment-metric';

@Injectable({
  providedIn: 'root',
})
export class ChromeStorage {
  async load(): Promise<PersistedAppState> {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const state = result[STORAGE_KEY] as PersistedAppState | undefined;

    if (!state) {
      return createDefaultAppState();
    }

    return {
      ...state,
      dashboardConfig: {
        ...state.dashboardConfig,
        metricsPeriod: isDashboardPeriod(
          state.dashboardConfig.metricsPeriod,
        )
          ? state.dashboardConfig.metricsPeriod
          : 'all',
      },
      chartMarkers: (state.chartMarkers ?? []).map((marker) => ({
        ...marker,
        color: marker.color ?? DEFAULT_CHART_MARKER_COLOR,
      })),
    };
  }

  async save(state: PersistedAppState): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEY]: state,
    });
  }

  async loadToolbarAction(): Promise<ToolbarAction> {
    const result = await chrome.storage.local.get(TOOLBAR_ACTION_KEY);

    return result[TOOLBAR_ACTION_KEY] === 'increment-metric'
      ? 'increment-metric'
      : 'open-widget';
  }

  async saveToolbarAction(action: ToolbarAction): Promise<void> {
    await chrome.storage.local.set({
      [TOOLBAR_ACTION_KEY]: action,
    });

    await chrome.action.setPopup({
      popup: action === 'open-widget' ? 'index.html' : '',
    });
  }

  async loadHotkeyMetricId(): Promise<string> {
    const result = await chrome.storage.local.get(HOTKEY_METRIC_KEY);
    const metricId: unknown = result[HOTKEY_METRIC_KEY];

    return typeof metricId === 'string'
      ? metricId
      : 'applications';
  }

  async saveHotkeyMetricId(metricId: string): Promise<void> {
    await chrome.storage.local.set({
      [HOTKEY_METRIC_KEY]: metricId,
    });
  }

  async loadBadgeMetricId(): Promise<string> {
    const result = await chrome.storage.local.get(BADGE_METRIC_KEY);
    const metricId: unknown = result[BADGE_METRIC_KEY];

    return typeof metricId === 'string'
      ? metricId
      : 'applications';
  }

  async saveBadgeMetricId(metricId: string): Promise<void> {
    await chrome.storage.local.set({
      [BADGE_METRIC_KEY]: metricId,
    });
  }

  async loadBadgePeriod(): Promise<BadgePeriod> {
    const result = await chrome.storage.local.get(BADGE_PERIOD_KEY);
    const period: unknown = result[BADGE_PERIOD_KEY];

    return isBadgePeriod(period) ? period : 'today';
  }

  async saveBadgePeriod(period: BadgePeriod): Promise<void> {
    await chrome.storage.local.set({
      [BADGE_PERIOD_KEY]: period,
    });
  }
}
