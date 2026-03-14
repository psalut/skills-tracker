import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest } from '../models/auth.model';
import { AuthStore } from './auth.store';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly baseUrl = environment.apiBaseUrl;

  readonly user = this.authStore.user;
  readonly accessToken = this.authStore.accessToken;
  readonly status = this.authStore.status;
  readonly initialized = this.authStore.initialized;
  readonly isAuthenticated = this.authStore.isAuthenticated;
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

  async rehydrateSession(): Promise<void> {
    const token = this.accessToken();

    if (!token) {
      this.authStore.markInitializedAnonymous();
      return;
    }

    try {
      const user = await this.fetchCurrentUser();

      this.authStore.setSession(user, token);
    } catch {
      this.authStore.clearSession();
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

  private fetchCurrentUser(): Promise<AuthUser> {
    return firstValueFrom(this.http.get<AuthUser>(`${this.baseUrl}/auth/me`));
  }
}
