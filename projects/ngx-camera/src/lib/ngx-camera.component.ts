// tslint:disable: max-line-length
import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter, Renderer2, AfterViewInit } from '@angular/core';
import { Observable, Subscription, Subject, of } from 'rxjs';
import { NgxCameraModule } from './ngx-camera.module';
import { CameraUtil } from './utils/camera.utils';

@Component({
  selector: 'lib-ngx-camera',
  templateUrl: './ngx-camera.component.html',
  styleUrls: ['./ngx-camera.component.sass']
})
export class NgxCameraComponent implements AfterViewInit {
  /** default video options */
  static DEFAULT_VIDEO_OPTIONS: MediaTrackConstraints = { aspectRatio: 1, height: 480, width: 640, facingMode: 'user' };

  /** last captured image data */
  captureImageData: any;

  /** canvas clear subscription  */
  clearSubscription: Subscription;

  /** camara trigger subscription  */
  triggerSubscription: Subscription;

  /** camara switch subscription  */
  cameraSwitcherSubscription: Subscription;

  /** event emitter for captured image  */
  mediaStream: any;

  /** refrence for video player tag  */
  @ViewChild('video', { static: true }) private video: ElementRef;

  /** refrence for canvas object tag */
  @ViewChild('canvas', { static: true }) private canvas: ElementRef;

  /** camera area height */
  @Input() public width = 640;

  /** camera area height */
  @Input() public height = 480;


  /** define camera image type */
  @Input() public imageType: CameraImageType | string = CameraImageType.jpeg;

  /** should start camera in after view init or not */
  @Input() public startCam: boolean = true;

  /** define camera image quality */
  @Input() public imageQuality = 0.9;

  /** event emitter for detected devices */
  @Output() public detectedDevices: EventEmitter<MediaDeviceInfo[]> = new EventEmitter();

  /** event emitter for captured video stream */
  @Output() public stream: EventEmitter<MediaDeviceInfo[]> = new EventEmitter();

  /** event emitter for errors occord at diffrent stages */
  @Output() public errorStream: EventEmitter<any> = new EventEmitter();

  /** event emitter for errors occord at diffrent stages */
  @Output() public imageCapture: EventEmitter<CameraImage> = new EventEmitter();


  /**
   * If the given Observable emits, clear canvas
   */
  @Input()
  public set clear(clear: Observable<void>) {
    if (this.clearSubscription) {
      this.clearSubscription.unsubscribe();
    }

    // Subscribe to events from this Observable to take snapshots
    this.clearSubscription = clear.subscribe(() => {
      const _canvas = this.canvas.nativeElement;
      const context2d = _canvas.getContext('2d');
      context2d.clearRect(0, 0, _canvas.width, _canvas.height);
    });
  }


  /**
   * If the given Observable emits, an image will be captured and emitted through 'imageCapture' EventEmitter
   */
  @Input()
  public set trigger(trigger: Observable<void>) {
    if (this.triggerSubscription) {
      this.triggerSubscription.unsubscribe();
    }

    // Subscribe to events from this Observable to take snapshots
    this.triggerSubscription = trigger.subscribe(() => {
      this.takeSnapshot();
    });
  }


  /**
   * If the given Observable emits, the active webcam will be switched to the one indicated by the emitted value.
   * @param switchCamera Indicates which webcam to switch to
   *   MediaDeviceInfo: activate the webcam with the given  MediaDeviceInfos
   */
  @Input()
  public set switchCamera(switchCamera: Observable<MediaDeviceInfo>) {
    if (this.cameraSwitcherSubscription) {
      this.cameraSwitcherSubscription.unsubscribe();
    }

    // Subscribe to events from this Observable to switch video device
    this.cameraSwitcherSubscription = switchCamera.subscribe((value: any) => {
      if (value instanceof MediaDeviceInfo) {
        this.switchToVideoInput(value);
      }
    });
  }


  /**
   * get native html element from video elementeRef
   * @returns native html element from video elementeRef
   */
  public get VideoElement() {
    return this.video.nativeElement;
  }

  /** available camera inputs list */
  public availableCameraInputs: MediaDeviceInfo[] = [];

  /** if video os initialized or not */
  public videoInitialized = false;

  /**
   * method to return MediaTrackConstraints from device id and baseMediaTrackConstraints
   * @param deviceId device id to merge MediaTrackConstraints with. you can pass null if you just want to get MediaTrackConstraints.
   * @param baseMediaTrackConstraints MediaTrackConstraints to merge with or you can use this getter ot get default MediaTrackConstraints bu passing null.
   * @returns merged MediaTrackConstraints from given device id and baseMediaTrackConstraints
   */
  private static getMediaConstraintsForDevice(deviceId: string, baseMediaTrackConstraints: MediaTrackConstraints): MediaTrackConstraints {
    const contstraints: MediaTrackConstraints = baseMediaTrackConstraints ? baseMediaTrackConstraints : NgxCameraComponent.DEFAULT_VIDEO_OPTIONS;
    if (deviceId) {
      contstraints.deviceId = { exact: deviceId };
    }
    return contstraints;
  }

  /**
   * @param Renderer2 we are using  r2 to menilulate the DOM element that wraps both camera and canvas
   */
  constructor(private r2: Renderer2) { }




  ngAfterViewInit() {
    // detect availabe device and start camera if any device is found;
    this.detectAvailableDevices().subscribe(inputs => {
      if (this.startCamera) {
        if (inputs.length > 0) {
          this.switchToVideoInput(inputs[0]);
        }
      }
    });
  }

  /**
   * allows you to switch to a spicific camera
   * @param info media info of device that you want to switch camera to
   */
  public switchToVideoInput(info: MediaDeviceInfo): void {
    this.videoInitialized = false;
    this.stopMediaTracks();
    const videoConstraints = NgxCameraComponent.getMediaConstraintsForDevice(info.deviceId, NgxCameraComponent.DEFAULT_VIDEO_OPTIONS);
    this.initWebcam(info.deviceId, videoConstraints);
  }

  /**
   * start a camera with particular device id
   * @param deviceId device id to start camera on
   */
  public startCamera(deviceId: string): void {
    this.videoInitialized = false;
    this.initWebcam(deviceId, NgxCameraComponent.DEFAULT_VIDEO_OPTIONS);
  }

  /**
   * list all the detected media device with kind video input
   * @returns observable of detected media devices after promis is resolved
   */
  private detectAvailableDevices(): Observable<MediaDeviceInfo[]> {
    const sub = new Subject<MediaDeviceInfo[]>();
    CameraUtil.getAvailableCameraInputs().subscribe(inputs => {
      this.detectedDevices.emit(inputs);
      sub.next(inputs);
    });
    return sub.asObservable();
  }

  /**
   *  initinitialize web cam with device id and constraints and assign all the data streams to respective variables.
   * @param deviceId device id to initinitialize web cam on
   * @param userVideoTrackConstraints user video track constraints.
   */
  private initWebcam(deviceId: string, userVideoTrackConstraints: MediaTrackConstraints) {
    const video = this.VideoElement;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const videoConstraints = NgxCameraComponent.getMediaConstraintsForDevice(deviceId, userVideoTrackConstraints);
      navigator.mediaDevices.getUserMedia({ video: videoConstraints } as MediaStreamConstraints)
        .then((stream: MediaStream) => {
          console.log(stream);
          this.videoInitialized = true;
          video.srcObject = stream;
          this.mediaStream = stream;
          video.play();
        });
    }

  }



  /**
   * stops all the media tracks
   */
  private stopMediaTracks() {
    if (this.mediaStream && this.mediaStream.getTracks) {
      // getTracks() returns all media tracks (video+audio)
      this.mediaStream.getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
    }
  }


  /**
   * Takes a snapshot of the current webcam's view and emits the image as an event
   */
  public takeSnapshot(): void {
    // set canvas size to actual video size

    const _video = this.VideoElement;
    const dimensions = { width: this.width, height: this.height };
    if (_video.videoWidth) {
      dimensions.width = _video.videoWidth;
      dimensions.height = _video.videoHeight;
    }

    const _canvas = this.canvas.nativeElement;
    _canvas.width = dimensions.width;
    _canvas.height = dimensions.height;

    // paint snapshot image to canvas
    const context2d = _canvas.getContext('2d');
    context2d.drawImage(_video, 0, 0);

    // read canvas content as image
    const mimeType: string = this.imageType ? this.imageType : 'image/png';
    const quality: number = this.imageQuality ? this.imageQuality : 0.9;
    const dataUrl: string = _canvas.toDataURL(mimeType, quality);

    // get the ImageData object from the canvas' context.
    let imageData: ImageData = null;

    if (this.captureImageData) {
      imageData = context2d.getImageData(0, 0, _canvas.width, _canvas.height);
    }
    console.log(dataUrl);

    this.imageCapture.next(new CameraImage(dataUrl, mimeType, imageData));
  }

}
enum WebcamMirrorProperties {
  auto = 'auto',
  always = 'always',
  never = 'never'  // ["auto", "always", "never"]
}

export interface CameraConfigInterface {
  width: number;
  height: number;
  element: ElementRef;
  imageType: CameraImageType;
  imageQuality: number;
}

export enum CameraImageType {
  jpeg = 'image/jpeg',
  png = 'image/png'
}



export class CameraImage {

  public constructor(imageAsDataUrl: string, mimeType: string, imageData: ImageData, ) {
    this._mimeType = mimeType;
    this._imageAsDataUrl = imageAsDataUrl;
    this._imageData = imageData;
  }

  private readonly _mimeType: string = null;
  private _imageAsBase64: string = null;
  private readonly _imageAsDataUrl: string = null;
  private readonly _imageData: ImageData = null;


  /**
   * Extracts the Base64 data out of the given dataUrl.
   * @param dataUrl the given dataUrl
   * @param mimeType the mimeType of the data
   */
  private static getDataFromDataUrl(dataUrl: string, mimeType: string) {
    return dataUrl.replace(`data:${mimeType};base64,`, '');
  }

  /**
   * Get the base64 encoded image data
   * @returns base64 data of the image
   */
  public get imageAsBase64(): string {
    return this._imageAsBase64 ? this._imageAsBase64
      : this._imageAsBase64 = CameraImage.getDataFromDataUrl(this._imageAsDataUrl, this._mimeType);
  }

  /**
   * Get the encoded image as dataUrl
   * @returns the dataUrl of the image
   */
  public get imageAsDataUrl(): string {
    return this._imageAsDataUrl;
  }

  /**
   * Get the ImageData object associated with the canvas' 2d context.
   * @returns the ImageData of the canvas's 2d context.
   */
  public get imageData(): ImageData {
    return this._imageData;
  }

}
