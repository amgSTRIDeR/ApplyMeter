import { Routes } from '@angular/router';

import { AppShell } from './shell/app-shell';

export const routes: Routes = [
  {
    path: '',
    component: AppShell,
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './dashboard/dashboard-page/dashboard-page'
            ).then((m) => m.DashboardPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import(
            './settings/settings-page/settings-page'
            ).then((m) => m.SettingsPage),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
