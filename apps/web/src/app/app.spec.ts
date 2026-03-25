import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { WarmupService } from './core/warmup/warmup.service';

describe('App', () => {
  const warmupService = {
    trigger: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: WarmupService, useValue: warmupService }],
    }).compileComponents();
  });

  it('should create the app shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    expect(warmupService.trigger).toHaveBeenCalledTimes(1);
  });
});
