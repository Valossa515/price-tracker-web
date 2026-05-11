import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { consentGuard } from './consent/consent.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'alerts' },
  {
    path: 'alerts',
    canActivate: [authGuard, consentGuard],
    loadComponent: () => import('./alert/alert-list').then(m => m.AlertList),
  },
  {
    path: 'alerts/new',
    canActivate: [authGuard, consentGuard],
    loadComponent: () => import('./alert/alert-create').then(m => m.AlertCreate),
  },
  {
    path: 'consent',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./consent/consent.component').then(m => m.ConsentComponent),
  },
  {
    path: 'account/delete',
    canActivate: [authGuard, consentGuard],
    loadComponent: () =>
      import('./account/account-delete.component').then(
        m => m.AccountDeleteComponent,
      ),
  },
  {
    path: 'callback',
    loadComponent: () => import('./callback/callback').then(m => m.Callback),
  },
  { path: 'logout', pathMatch: 'full', redirectTo: '' },
];
