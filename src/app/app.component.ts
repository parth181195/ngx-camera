import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { CameraImage } from 'ngx-camera';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  title = 'camera';
  devices: MediaDeviceInfo[] = [];
  switch = new Subject<MediaDeviceInfo>();
  snap = new Subject<string>();
  clear = new Subject<string>();
  imageCaptured = false;
  imageData: CameraImage;
  public get webcam() {
    return this.switch.asObservable();
  }
  public get clearCanvas() {
    return this.clear.asObservable();
  }
  public get trigger() {
    return this.snap.asObservable();
  }
  logDevices(e) {
    console.log(e);
    this.devices = e;
  }
  switchDevice(device) {
    console.log(device);
    this.switch.next(device);
  }
  snapshot() {
    this.snap.next('');
  }
  onImageCapture(e) {
    console.log(e);
    if (e) {
      this.imageCaptured = true;
      this.imageData = e;
    }
  }
  onImagereject() {
    if (this.imageData) {
      this.clear.next('');
      this.imageCaptured = false;
    }
  }
  onImageAccept() {
    if (this.imageData) {
      this.clear.next('');
      this.imageCaptured = false;
    }
  }
}
