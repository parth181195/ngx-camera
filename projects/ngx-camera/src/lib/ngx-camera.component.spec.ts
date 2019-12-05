import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxCameraComponent } from './ngx-camera.component';

describe('NgxCameraComponent', () => {
  let component: NgxCameraComponent;
  let fixture: ComponentFixture<NgxCameraComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgxCameraComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxCameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
