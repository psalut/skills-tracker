import { Route } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { publicGuard } from './core/auth/public.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'skills',
        loadComponent: () =>
          import('./features/skills/skills').then((m) => m.Skills),
      },
      {
        path: 'my-skills',
        loadComponent: () =>
          import('./features/user-skills/user-skills').then(
            (m) => m.UserSkills,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile').then((m) => m.Profile),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
    canActivate: [publicGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
