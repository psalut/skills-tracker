import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { WarmupService } from './warmup.service';
import { environment } from '../../../environments/environment';

describe('WarmupService', () => {
  let service: WarmupService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    service = TestBed.inject(WarmupService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fires the warmup request only once', () => {
    service.trigger();
    service.trigger();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/warmup`);
    expect(request.request.method).toBe('GET');
    request.flush({ status: 'ok' });
  });

  it('swallows warmup failures', () => {
    service.trigger();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/warmup`);
    request.flush('offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  });
});
