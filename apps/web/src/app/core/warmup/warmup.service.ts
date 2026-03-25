import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { EMPTY } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WarmupService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private hasStarted = false;
  readonly isConnecting = signal(false);

  trigger(): void {
    if (this.hasStarted) {
      return;
    }

    this.hasStarted = true;
    this.isConnecting.set(true);

    this.http
      .get(`${this.baseUrl}/warmup`)
      .pipe(
        catchError(() => EMPTY),
        finalize(() => this.isConnecting.set(false)),
      )
      .subscribe();
  }
}
