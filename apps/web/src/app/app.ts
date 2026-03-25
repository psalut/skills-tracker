import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WarmupService } from './core/warmup/warmup.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly warmupService = inject(WarmupService);

  constructor() {
    this.warmupService.trigger();
  }
}
