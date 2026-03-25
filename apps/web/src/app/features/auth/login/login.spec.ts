import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { Login } from './login';
import { AuthService } from '../../../core/auth/auth.service';
import { WarmupService } from '../../../core/warmup/warmup.service';

describe('Login', () => {
  async function setup({
    login = vi.fn(async () => undefined),
    navigateByUrl = vi.fn(async () => true),
    isConnecting = false,
  }: {
    login?: ReturnType<typeof vi.fn>;
    navigateByUrl?: ReturnType<typeof vi.fn>;
    isConnecting?: boolean;
  } = {}) {
    const authService = {
      login,
    };

    const warmupService = {
      isConnecting: signal(isConnecting),
    };

    const router = {
      navigateByUrl,
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: WarmupService, useValue: warmupService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    return {
      fixture,
      component: fixture.componentInstance,
      authService,
      warmupService,
      router,
    };
  }

  it('shows validation errors and avoids submitting an invalid form', async () => {
    const { component, fixture, authService } = await setup();

    await component.onSubmit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(authService.login).not.toHaveBeenCalled();
    expect(compiled.textContent).toContain('Enter a valid email address.');
    expect(compiled.textContent).toContain(
      'Password must have at least 8 characters.',
    );
  });

  it('keeps the form invalid when the password is shorter than 8 characters', async () => {
    const { component, authService } = await setup();

    component.form.setValue({
      email: 'pablo@mail.com',
      password: '1234567',
    });

    await component.onSubmit();

    expect(component.form.invalid).toBe(true);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('submits credentials and redirects to the dashboard on success', async () => {
    const { component, authService, router } = await setup();

    component.form.setValue({
      email: 'pablo@mail.com',
      password: '12345678',
    });

    await component.onSubmit();

    expect(authService.login).toHaveBeenCalledTimes(1);
    expect(authService.login).toHaveBeenCalledWith({
      email: 'pablo@mail.com',
      password: '12345678',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard', {
      replaceUrl: true,
    });
    expect(component.errorMessage()).toBeNull();
    expect(component.isSubmitting()).toBe(false);
  });

  it('shows an authentication error when login fails', async () => {
    const { component, fixture, router } = await setup({
      login: vi.fn(async () => {
        throw new Error('invalid credentials');
      }),
    });

    component.form.setValue({
      email: 'pablo@mail.com',
      password: 'wrongpass',
    });

    await component.onSubmit();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(component.isSubmitting()).toBe(false);
    expect(component.errorMessage()).toBe('Invalid email or password.');
    expect(compiled.textContent).toContain('Invalid email or password.');
  });

  it('shows a connecting notice while the database warmup is in progress', async () => {
    const { fixture } = await setup({ isConnecting: true });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain(
      'Connecting to the database for the first time...',
    );
  });

  it('hides the connecting notice after the warmup finishes', async () => {
    const { fixture } = await setup({ isConnecting: false });

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).not.toContain(
      'Connecting to the database for the first time...',
    );
  });
});
