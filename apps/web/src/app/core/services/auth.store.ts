import { Injectable, computed, signal } from '@angular/core';
import { AuthState, AuthUser } from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'access_token';

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly state = signal<AuthState>({
    user: null,
    accessToken: this.getStoredToken(),
    status: 'idle',
    initialized: false,
  });

  readonly user = computed(() => this.state().user);
  readonly accessToken = computed(() => this.state().accessToken);
  readonly status = computed(() => this.state().status);
  readonly initialized = computed(() => this.state().initialized);

  readonly isAuthenticated = computed(() => {
    const state = this.state();
    return Boolean(state.user && state.accessToken);
  });

  readonly isLoading = computed(() => this.state().status === 'loading');

  setLoading(): void {
    this.patchState({ status: 'loading' });
  }

  setSession(user: AuthUser, accessToken: string | null): void {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }

    this.patchState({
      user,
      accessToken,
      status: 'authenticated',
      initialized: true,
    });
  }

  clearSession(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);

    this.state.set({
      user: null,
      accessToken: null,
      status: 'anonymous',
      initialized: true,
    });
  }

  markInitializedAnonymous(): void {
    this.patchState({
      user: null,
      accessToken: null,
      status: 'anonymous',
      initialized: true,
    });
  }

  private patchState(patch: Partial<AuthState>): void {
    this.state.update((current) => ({
      ...current,
      ...patch,
    }));
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
}
