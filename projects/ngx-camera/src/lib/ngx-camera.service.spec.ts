import { TestBed } from '@angular/core/testing';

import { NgxCameraService } from './ngx-camera.service';

describe('NgxCameraService', () => {
  let service: NgxCameraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgxCameraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
