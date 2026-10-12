import { Injectable } from '@angular/core';

import { createDefaultAppState } from '../dashboard/dashboard.defaults';
import type { PersistedAppState } from '../dashboard/dashboard.models';

const STORAGE_KEY = 'applymeter.state';

@Injectable({
  providedIn: 'root',
})
export class ChromeStorage {
  async load(): Promise<PersistedAppState> {
    const result = await chrome.storage.local.get(STORAGE_KEY);

    return (
      (result[STORAGE_KEY] as PersistedAppState | undefined) ??
      createDefaultAppState()
    );
  }

  async save(state: PersistedAppState): Promise<void> {
    await chrome.storage.local.set({
      [STORAGE_KEY]: state,
    });
  }
}
