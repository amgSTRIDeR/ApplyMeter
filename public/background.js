const STORAGE_KEY = 'applymeter.state';
const TOOLBAR_ACTION_KEY = 'applymeter.toolbarAction';
const HOTKEY_METRIC_KEY = 'applymeter.hotkeyMetricId';
const BADGE_METRIC_KEY = 'applymeter.badgeMetricId';
const BADGE_PERIOD_KEY = 'applymeter.badgePeriod';
const BADGE_REFRESH_ALARM = 'applymeter.dailyBadgeRefresh';
const CONTEXT_MENU_OPEN_WIDGET_ID = 'applymeter-open-widget';
const CONTEXT_MENU_ITEM_PREFIX = 'applymeter-increment:';
const APPLICATION_METRIC_ID = 'applications';
const HOTKEY_COMMAND = 'increment-applications';

let taskQueue = Promise.resolve();

chrome.action.onClicked.addListener(() => {
  enqueue(
    incrementSelectedMetric,
    'ApplyMeter toolbar action failed.',
  );
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== HOTKEY_COMMAND) {
    return;
  }

  enqueue(
    incrementSelectedMetric,
    'ApplyMeter keyboard shortcut failed.',
  );
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === CONTEXT_MENU_OPEN_WIDGET_ID) {
    enqueue(
      openWidgetFromContextMenu,
      'ApplyMeter widget could not be opened.',
    );
    return;
  }

  if (
    typeof info.menuItemId !== 'string' ||
    !info.menuItemId.startsWith(CONTEXT_MENU_ITEM_PREFIX)
  ) {
    return;
  }

  const metricId = info.menuItemId.slice(
    CONTEXT_MENU_ITEM_PREFIX.length,
  );

  enqueue(
    () => incrementMetric(metricId),
    `ApplyMeter context menu action for "${metricId}" failed.`,
  );
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') {
    return;
  }

  if (changes[TOOLBAR_ACTION_KEY]) {
    enqueue(
      applyToolbarAction,
      'ApplyMeter toolbar action could not be updated.',
    );
  }

  if (
    changes[BADGE_METRIC_KEY] ||
    changes[BADGE_PERIOD_KEY] ||
    changes[STORAGE_KEY]
  ) {
    enqueue(updateBadge, 'ApplyMeter could not update the badge.');
  }

  const stateChange = changes[STORAGE_KEY];

  if (
    stateChange &&
    metricsChanged(stateChange.oldValue, stateChange.newValue)
  ) {
    enqueue(
      rebuildContextMenu,
      'ApplyMeter context menu could not be updated.',
    );
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== BADGE_REFRESH_ALARM) {
    return;
  }

  enqueue(updateBadge, 'ApplyMeter could not update the daily badge.');
  scheduleNextBadgeRefresh();
});

chrome.runtime.onInstalled.addListener(() => {
  enqueue(
    applyToolbarAction,
    'ApplyMeter toolbar action could not be initialized.',
  );
  enqueue(updateBadge, 'ApplyMeter could not initialize the badge.');
  enqueue(
    rebuildContextMenu,
    'ApplyMeter context menu could not be initialized.',
  );
  scheduleNextBadgeRefresh();
});

chrome.runtime.onStartup.addListener(() => {
  enqueue(
    applyToolbarAction,
    'ApplyMeter toolbar action could not be initialized.',
  );
  enqueue(updateBadge, 'ApplyMeter could not initialize the badge.');
  enqueue(
    rebuildContextMenu,
    'ApplyMeter context menu could not be initialized.',
  );
  scheduleNextBadgeRefresh();
});

function enqueue(task, errorMessage) {
  taskQueue = taskQueue
    .then(task)
    .catch((error) => {
      console.error(errorMessage, error);
    });
}

async function applyToolbarAction() {
  const stored = await chrome.storage.local.get(TOOLBAR_ACTION_KEY);
  const incrementsMetric =
    stored[TOOLBAR_ACTION_KEY] === 'increment-metric';

  await Promise.all([
    chrome.action.setPopup({
      popup: incrementsMetric ? '' : 'index.html',
    }),
    chrome.action.setTitle({
      title: incrementsMetric
        ? 'ApplyMeter: increase selected metric'
        : 'ApplyMeter: open dashboard widget',
    }),
  ]);
}

async function openWidgetFromContextMenu() {
  await chrome.action.setPopup({ popup: 'index.html' });
  await chrome.action.openPopup();
  await applyToolbarAction();
}

async function incrementSelectedMetric() {
  const stored = await chrome.storage.local.get(HOTKEY_METRIC_KEY);
  const metricId =
    stored[HOTKEY_METRIC_KEY] ?? APPLICATION_METRIC_ID;

  if (typeof metricId !== 'string' || !metricId) {
    throw new Error('No metric is selected for quick increment.');
  }

  await incrementMetric(metricId);
}

async function incrementMetric(metricId) {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  let state = stored[STORAGE_KEY];

  if (!state) {
    state = createDefaultAppState();
    await chrome.storage.local.set({
      [STORAGE_KEY]: state,
    });
  }

  const metric = state.metrics.find(
    (item) => item.id === metricId && !item.archived,
  );

  if (!metric) {
    throw new Error(`Metric "${metricId}" is not available.`);
  }

  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      ...state,
      events: [
        ...state.events,
        {
          id: crypto.randomUUID(),
          metricId,
          delta: 1,
          createdAt: new Date().toISOString(),
        },
      ],
    },
  });
}

async function rebuildContextMenu() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  const state = stored[STORAGE_KEY] ?? createDefaultAppState();

  await removeAllContextMenus();
  await createContextMenu({
    id: CONTEXT_MENU_OPEN_WIDGET_ID,
    title: 'Open ApplyMeter widget',
    contexts: ['page', 'action'],
  });

  const metrics = state.metrics.filter((metric) => !metric.archived);

  for (const metric of metrics) {
    await createContextMenu({
      id: `${CONTEXT_MENU_ITEM_PREFIX}${metric.id}`,
      title: `Increase ${metric.name}`,
      contexts: ['page', 'action'],
    });
  }
}

function removeAllContextMenus() {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.removeAll(() => {
      const error = chrome.runtime.lastError;

      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}

function createContextMenu(properties) {
  return new Promise((resolve, reject) => {
    chrome.contextMenus.create(properties, () => {
      const error = chrome.runtime.lastError;

      if (error) {
        reject(new Error(error.message));
        return;
      }

      resolve();
    });
  });
}

function metricsChanged(previousState, nextState) {
  const metricSignature = (state) =>
    JSON.stringify(
      (state?.metrics ?? []).map(({ id, name, archived }) => [
        id,
        name,
        archived,
      ]),
    );

  return metricSignature(previousState) !== metricSignature(nextState);
}

async function updateBadge() {
  const stored = await chrome.storage.local.get([
    STORAGE_KEY,
    BADGE_METRIC_KEY,
    BADGE_PERIOD_KEY,
  ]);
  const state = stored[STORAGE_KEY] ?? createDefaultAppState();
  const metricId =
    stored[BADGE_METRIC_KEY] ?? APPLICATION_METRIC_ID;
  const period = stored[BADGE_PERIOD_KEY] ?? 'today';
  const metric =
    metricId === 'none'
      ? undefined
      : state.metrics.find(
          (item) => item.id === metricId && !item.archived,
        );
  const now = new Date();
  const periodStart = getBadgePeriodStart(period, now);
  const total = metric
    ? state.events.reduce((sum, event) => {
        const eventDate = new Date(event.createdAt);

        return event.metricId === metric.id &&
          eventDate <= now &&
          (!periodStart || eventDate >= periodStart)
          ? sum + event.delta
          : sum;
      }, 0)
    : 0;
  const badgeText = metric
    ? total > 999
      ? '999+'
      : String(Math.max(total, 0))
    : '';

  await chrome.action.setBadgeBackgroundColor({
    color: '#7657e8',
  });
  await chrome.action.setBadgeText({ text: badgeText });
}

function getBadgePeriodStart(period, referenceDate) {
  if (period === 'all') {
    return null;
  }

  const dayCount = {
    today: 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
  }[period] ?? 1;
  const start = new Date(referenceDate);

  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - dayCount + 1);

  return start;
}

function scheduleNextBadgeRefresh() {
  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 0, 0);

  chrome.alarms.create(BADGE_REFRESH_ALARM, {
    when: nextMidnight.getTime(),
  });
}

function getLocalDateString(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function createDefaultAppState() {
  return {
    schemaVersion: 1,
    metrics: [
      {
        id: 'applications',
        name: 'Applications',
        icon: 'send',
        color: '#7657e8',
        archived: false,
      },
      {
        id: 'interviews',
        name: 'Interviews',
        icon: 'groups',
        color: '#4f7cff',
        archived: false,
      },
      {
        id: 'offers',
        name: 'Offers',
        icon: 'work',
        color: '#27a36a',
        archived: false,
      },
      {
        id: 'rejections',
        name: 'Rejections',
        icon: 'close',
        color: '#dc5a5a',
        archived: false,
      },
    ],
    events: [],
    chartMarkers: [],
    conversions: [
      {
        id: 'applications-to-interviews',
        fromMetricId: 'applications',
        toMetricId: 'interviews',
      },
      {
        id: 'interviews-to-offers',
        fromMetricId: 'interviews',
        toMetricId: 'offers',
      },
    ],
    dashboardConfig: {
      metricOrder: [
        'applications',
        'interviews',
        'offers',
        'rejections',
      ],
      chartMetricIds: ['applications', 'interviews'],
      conversionOrder: [
        'applications-to-interviews',
        'interviews-to-offers',
      ],
      period: 'all',
      metricsPeriod: 'all',
    },
  };
}
