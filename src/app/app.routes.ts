import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'lock',
    loadComponent: () => import('./features/lock').then((m) => m.LockComponent),
    title: 'Step inside · AR Atrium',
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () => import('./features/shell').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/home').then((m) => m.HomeComponent),
        title: 'AR Atrium · One space. Every creation.',
      },
      ...['explore', 'study', 'playground', 'libraries'].map((path) => ({
        path,
        loadComponent: () => import('./features/directory').then((m) => m.DirectoryComponent),
      })),
      {
        path: 'app/:id',
        loadComponent: () => import('./features/detail').then((m) => m.DetailComponent),
      },
      {
        path: 'about',
        loadComponent: () => import('./features/about').then((m) => m.AboutComponent),
        title: 'About · AR Atrium',
      },
    ],
  },
  { path: '**', redirectTo: '/explore' },
];
