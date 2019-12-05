import { NgModule } from '@angular/core';
import { NgxCameraComponent } from './ngx-camera.component';
import { CommonModule } from '@angular/common';



@NgModule({
  declarations: [NgxCameraComponent],
  imports: [
    CommonModule
  ],
  exports: [NgxCameraComponent]
})
export class NgxCameraModule { }
