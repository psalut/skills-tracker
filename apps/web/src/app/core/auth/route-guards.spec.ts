import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';
import { publicGuard } from './public.guard';

describe('route guards', () => {
  const route = {} as never;
  const state = {} as never;

  async function setup(isAuthenticated: boolean, hasStoredToken = false) {
    const authService = {
      isAuthenticated: vi.fn(() => isAuthenticated),
      hasStoredToken: vi.fn(() => hasStoredToken),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    return {
      router: TestBed.inject(Router),
      authService,
    };
  }

  it('authGuard allows authenticated users', async () => {
    const { authService } = await setup(true);

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(true);
    expect(authService.isAuthenticated).toHaveBeenCalledTimes(1);
  });

  it('authGuard allows users with a stored token while session is rehydrating', async () => {
    const { authService } = await setup(false, true);

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBe(true);
    expect(authService.isAuthenticated).toHaveBeenCalledTimes(1);
    expect(authService.hasStoredToken).toHaveBeenCalledTimes(1);
  });

  it('authGuard redirects anonymous users to login', async () => {
    const { router } = await setup(false);

    const result = TestBed.runInInjectionContext(() => authGuard(route, state));

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('publicGuard allows anonymous users', async () => {
    const { authService } = await setup(false);

    const result = TestBed.runInInjectionContext(() =>
      publicGuard(route, state),
    );

    expect(result).toBe(true);
    expect(authService.isAuthenticated).toHaveBeenCalledTimes(1);
  });

  it('publicGuard redirects users with a stored token to dashboard', async () => {
    const { router } = await setup(false, true);

    const result = TestBed.runInInjectionContext(() =>
      publicGuard(route, state),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });

  it('publicGuard redirects authenticated users to dashboard', async () => {
    const { router } = await setup(true);

    const result = TestBed.runInInjectionContext(() =>
      publicGuard(route, state),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/dashboard');
  });
});
