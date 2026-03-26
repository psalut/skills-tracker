import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest } from './auth.model';
import { AuthStore } from './auth.store';

const SESSION_REHYDRATION_TIMEOUT_MS = 1500;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly baseUrl = environment.apiBaseUrl;

  readonly user = this.authStore.user;
  readonly accessToken = this.authStore.accessToken;
  readonly status = this.authStore.status;
  readonly initialized = this.authStore.initialized;
  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly hasStoredToken = computed(() => Boolean(this.authStore.accessToken()));
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');
  readonly isLoading = computed(
    () => this.authStore.isLoading() || !this.authStore.initialized(),
  );

  async login(payload: LoginRequest): Promise<void> {
    this.authStore.setLoading();

    try {
      const response = await firstValueFrom(
        this.http.post<{ accessToken: string }>(
          `${this.baseUrl}/auth/login`,
          payload,
        ),
      );

      this.authStore.setAccessToken(response.accessToken);

      const user = await this.fetchCurrentUser();

      this.authStore.setSession(user, response.accessToken);
    } catch (error) {
      this.authStore.clearSession();
      throw error;
    }
  }

  initializeSession(): void {
    const token = this.accessToken();

    if (!token) {
      this.authStore.markInitializedAnonymous();
      return;
    }

    this.authStore.setLoading();
    void this.rehydrateSession();
  }

  async rehydrateSession(): Promise<void> {
    const token = this.accessToken();

    if (!token) {
      this.authStore.markInitializedAnonymous();
      return;
    }

    try {
      const user = await this.fetchCurrentUser(SESSION_REHYDRATION_TIMEOUT_MS);

      this.authStore.setSession(user, token);
    } catch (error) {
      if (this.isAuthorizationError(error)) {
        this.authStore.clearSession();
        await this.router.navigateByUrl('/login', { replaceUrl: true });
        return;
      }

      this.authStore.markInitializedWithStoredToken();
    }
  }

  async logout(): Promise<void> {
    this.authStore.clearSession();
  }

  async refreshCurrentUser(): Promise<AuthUser> {
    const user = await this.fetchCurrentUser();
    this.authStore.setSession(user, this.accessToken());

    return user;
  }

  private fetchCurrentUser(timeoutMs?: number): Promise<AuthUser> {
    const request = this.http.get<AuthUser>(`${this.baseUrl}/auth/me`);

    return firstValueFrom(
      timeoutMs ? request.pipe(timeout({ first: timeoutMs })) : request,
    );
  }

  private isAuthorizationError(error: unknown): boolean {
    return (
      error instanceof HttpErrorResponse &&
      (error.status === 401 || error.status === 403)
    );
  }
}
