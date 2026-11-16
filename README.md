# ApplyMeter

A minimal browser extension for tracking your job search activity.

Track applications, interviews, offers, and rejections in one place — with simple statistics and no account required.

## Features

* Track applications
* Track interviews
* Track offers
* Track rejections
* Increment or decrement counters instantly
* Increment metrics from the dashboard, one keyboard shortcut, or context menu
* Display a selected metric's total for a chosen period on the extension icon
* See daily activity charts for 7, 30, 90 days, or all time
* Filter metric cards independently of the activity chart
* Add, edit, and delete colored chart markers with descriptions shown on hover
* View simple conversion statistics
* Data is stored locally in your browser
* No account required
* No backend required

## Privacy

ApplyMeter is local-first.

Your job search statistics are stored using `chrome.storage.local` and remain on your device.

ApplyMeter does not require access to your browsing history, job boards, emails, or personal accounts.

In Settings, choose whether the extension icon opens the dashboard widget
or increments a metric, select the metric for the keyboard shortcut, and
choose the metric and period shown on the icon. Chrome manages shortcut assignments at
`chrome://extensions/shortcuts`. Right-click a page or the extension icon
to increment any active metric from the context menu.

## Tech Stack

* Angular
* TypeScript
* Chrome Extensions Manifest V3
* `chrome.storage.local`

## Architecture

```text
Angular Extension
       │
       ├── Dashboard
       ├── Counters
       ├── Statistics
       └── Settings
              │
              ▼
      chrome.storage.local
```

The first version of ApplyMeter does not require a backend.

## Planned

* Custom categories
* Configurable statistics periods
* Data export/import
* Additional browser support
* Optional cloud sync

## Development

Requirements:

* Node.js
* npm
* Angular CLI

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm start
```

Build the extension:

```bash
npm run build
```

## Status

🚧 ApplyMeter is currently in development.

## License

MIT
