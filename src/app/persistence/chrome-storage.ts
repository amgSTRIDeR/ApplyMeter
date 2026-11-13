import { Injectable } from '@angular/core';

import {
  createDefaultAppState,
  DEFAULT_CHART_MARKER_COLOR,
} from '../dashboard/dashboard.defaults';
import type { PersistedAppState } from '../dashboard/dashboard.models';

const STORAGE_KEY = 'applymeter.state';

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
}
