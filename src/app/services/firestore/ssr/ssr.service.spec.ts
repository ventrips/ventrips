import { TestBed } from '@angular/core/testing';

import { SsrService } from './ssr.service';

describe('SsrService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SsrService = TestBed.get(SsrService);
    expect(service).toBeTruthy();
  });
});
