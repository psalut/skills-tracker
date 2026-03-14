import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse } from '../models/auth.model';
import { AuthStore } from './auth.store';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly tokenStorageKey = 'access_token';

  async login(payload: LoginRequest): Promise<void> {
    this.authStore.setLoading();

    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>('/api/auth/login', payload),
      );

      this.authStore.setSession(response.user, response.accessToken);
    } catch (error) {
      this.authStore.clearSession();
      throw error;
    }
  }

  async rehydrateSession(): Promise<void> {
    const token = this.authStore.accessToken();

    if (!token) {
      this.authStore.markInitializedAnonymous();
      return;
    }

    try {
      const user = await firstValueFrom(
        this.http.get<AuthUser>('/api/auth/me'),
      );

      this.authStore.setSession(user, token);
    } catch {
      this.authStore.clearSession();
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/auth/logout', {}));
    } finally {
      this.authStore.clearSession();
    }
  }
}
