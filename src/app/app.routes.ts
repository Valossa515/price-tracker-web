import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'alerts' },
  {
    path: 'alerts',
    canActivate: [authGuard],
    loadComponent: () => import('./alert/alert-list').then(m => m.AlertList),
  },
  {
    path: 'alerts/new',
    canActivate: [authGuard],
    loadComponent: () => import('./alert/alert-create').then(m => m.AlertCreate),
  },
  {
    path: 'callback',
    loadComponent: () => import('./callback/callback').then(m => m.Callback),
  },
];
