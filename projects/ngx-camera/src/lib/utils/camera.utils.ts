import { Observable, Subject } from 'rxjs';

export class CameraUtil {

  public static getAvailableCameraInputs(): Observable<MediaDeviceInfo[]> {
    const sub = new Subject<MediaDeviceInfo[]>();
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      sub.error('.enumerateDevices method  not supported.');
      return sub.asObservable();
    }

    navigator.mediaDevices.enumerateDevices()
      .then((devices: MediaDeviceInfo[]) => {
        sub.next(devices.filter((device: MediaDeviceInfo) => device.kind === 'videoinput'));
      })
      .catch(err => {
        sub.next(err.message || err);
      });
    return sub.asObservable();
  }
}
