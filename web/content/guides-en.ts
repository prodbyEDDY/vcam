export const guidesEn=[
 {slug:'iphone-webcam-windows',ru:'iphone-veb-kamera-windows',title:'Use your iPhone as a free webcam on Windows',description:'Connect an iPhone to Windows with VCam and Safari. Set up QR pairing, select the virtual camera, and fix permissions or a black picture.',body:`VCam lets you use an iPhone camera in a Windows video call or recording without installing an iPhone app. The Windows receiver creates a virtual webcam; Safari supplies the video over your local Wi-Fi network. The current version is free, with no watermark or subscription. It transmits video only, so choose a separate microphone.

## Before you start

You need a 64-bit Windows 10 or Windows 11 computer, an iPhone with Safari, and a local network that allows the devices to reach each other. Both devices need internet access to open the website and pair. Guest Wi-Fi often isolates devices even when they use the same network name. VCam currently has no TURN video relay, macOS receiver or dedicated USB mode.

Download the receiver from the [official download page](/en/download). Administrator permission is needed to register the Windows virtual camera. The beta installer is not signed with a publisher certificate; use the official GitHub release linked there.

## Connect the iPhone camera

1. Install and open VCam on Windows. Click **Show QR code**.
2. Scan that QR with your iPhone camera, open the link in Safari, and allow camera access. Alternatively, open [Connect phone](/en/connect) and enter the eight-character code from VCam.
3. Keep the camera page visible and the iPhone unlocked. Wait for the video preview in the receiver.
4. Open the camera settings in your Windows application and choose **VCam**. Restart that application if it was already open when the virtual camera was installed.
5. Select the computer microphone or a separate microphone. Check the picture and sound before joining a call.

The QR and typed code are single-use and expire after ten minutes. If pairing expires, create a new QR in the Windows app. Avoid sharing a live code or screenshot of it publicly.

## Choose a usable picture

Place the phone securely at eye level and clean the rear lens. Use a light facing you rather than a bright window behind you. Start with 1080p at 30 FPS when available; a higher resolution is not automatically a better call when Wi-Fi or the application reduces it.

VCam checks supported camera modes and offers the ones it confirms. Safari may expose fewer lenses and manual controls than the built-in iPhone Camera app. Up to 4K and 60 FPS are possible on supported devices, but 4K60 is not guaranteed. Use the receiver controls to adjust rotation, mirroring and zoom where available. A mirrored preview in a call application may differ from the picture other participants receive.

## If permission or video fails

If Safari denies access, review the camera permission for this website in Safari settings and reload the page. Close other applications that could be using the camera. If the connection stalls, check the local network, client isolation and VPN, then create a fresh QR code. Keep Safari in the foreground: locking the phone or switching applications may pause the camera.

For a connected phone with a black picture in OBS, confirm that the receiver preview is live and select VCam as a Video Capture Device. Try a lower mode or restart OBS after installation. See the [OBS guide](/en/guides/phone-camera-obs) and [Wi-Fi troubleshooting](/en/guides/wifi-webcam-troubleshooting).

## Privacy and feedback

The video is encrypted and travels directly to the computer. VCam does not record or store it on its server; the server serves the site and exchanges pairing information. Read [how VCam works](/en/about) for the product's current limits. If a particular iPhone or Safari version fails, [report an issue](https://github.com/prodbyEDDY/vcam/issues) with the model, browser, Windows and VCam versions, without a live pairing code.`},
 {slug:'android-webcam-windows',ru:'android-veb-kamera-windows',title:'Use an Android phone as a free Windows webcam',description:'Turn an Android camera into a Windows webcam using VCam and Chrome, with no Android app. Pair the devices and choose reliable camera settings.',body:`VCam can turn an Android phone into a webcam for compatible Windows applications. Install the receiver on the computer and open the phone camera in Chrome. There is no Android app to install, and all implemented VCam features are free without ads or a watermark.

## What you need

Use 64-bit Windows 10 or Windows 11, an Android phone with Chrome and permission to use its camera, and one local Wi-Fi network without device isolation. Internet is needed to load the phone page and pair. The current receiver supports Windows only and sends video, not phone microphone audio. It does not provide a dedicated USB connection mode.

Get the receiver from [Download VCam](/en/download). The installer registers a DirectShow virtual camera and needs administrator permission. The beta installer is not yet signed with a publisher certificate. The official release and source repository are linked on the download page.

## Pair Android with the receiver

1. Install VCam, open it on Windows and click **Show QR code**.
2. Scan the QR with your phone camera and open the link in Chrome. You can also use the scanner at [Connect phone](/en/connect) or type the eight-character code shown on Windows.
3. Allow camera access when Chrome asks. Wait until video appears in the Windows preview.
4. Select **VCam** in the camera settings of OBS, Zoom or another program that accepts DirectShow virtual cameras.
5. Choose a separate microphone, keep the phone page open, and check a short test call or recording.

Codes are valid for ten minutes and can be used once. Create a new QR if the old code was consumed or expired. Restart a call application after installing VCam if it does not list the new camera.

## Cameras, zoom and quality

Chrome may expose the front and rear cameras and, on some phones, additional lenses. Use the Windows controls to switch among the devices provided by the browser. A camera's manufacturer label does not necessarily mean Chrome exposes all its native photography features.

VCam probes combinations including 720p30, 1080p30/60 and 4K30/60 and offers the modes it confirms for the current camera. Availability depends on the phone and browser, so do not assume every Android phone supports 4K60. Switching lenses can change the available modes. Start with 1080p30 or 720p30 if the picture freezes or the phone warms up. A clear lens, steady mount and good light can improve the result without increasing bandwidth.

## Fix camera permissions or interruptions

If camera access is blocked, review this site's camera permission in Chrome and Android's camera permission for Chrome. Reload the page and retry. Close another app that could own the camera. VCam needs a secure HTTPS page; an arbitrary HTTP page will not provide normal camera access.

Keep Chrome visible and the phone unlocked. Android can stop or restrict camera capture when the page moves to the background. The Windows app can be minimized while receiving video. For failed pairing, check that neither device is on isolated guest Wi-Fi, test without a VPN, and create a fresh QR. More detailed checks are in [Wi-Fi troubleshooting](/en/guides/wifi-webcam-troubleshooting).

## Check the destination application

The receiver preview confirms the phone stream; your call program has its own camera selection and quality settings. Select VCam there and test the output. In OBS, use a Video Capture Device source, as described in the [phone camera OBS guide](/en/guides/phone-camera-obs). Compatibility with every application and phone model has not been tested.

Read [product and privacy information](/en/about) for the direct WebRTC connection and current limitations. For reproducible errors, [report your device and versions](https://github.com/prodbyEDDY/vcam/issues) without including an active pairing code.`},
 {slug:'phone-camera-obs',ru:'telefon-kamera-obs',title:'Use a phone camera in OBS Studio with VCam',description:'Add an iPhone or Android camera to OBS on Windows using the free VCam receiver. Configure the video source, separate audio and a test recording.',body:`VCam supplies a DirectShow virtual camera that OBS Studio on Windows can use as a Video Capture Device. Your phone sends video from Safari or Chrome to the Windows receiver. There is no phone app, VCam watermark or paid quality setting. Audio needs a separate microphone.

## First connect the phone

Install [VCam for Windows](/en/download), open the receiver and click **Show QR code**. Connect the phone and computer to the same local Wi-Fi network without client isolation. Open the QR link in Safari on iPhone or Chrome on Android and allow the camera. You can also enter the one-time code at [Connect phone](/en/connect).

Do not proceed until you have a live picture in the VCam receiver. If this step fails, follow the [iPhone guide](/en/guides/iphone-webcam-windows), [Android guide](/en/guides/android-webcam-windows) or [network checks](/en/guides/wifi-webcam-troubleshooting). Keep the phone screen unlocked and the page visible throughout capture.

## Add the camera in OBS

1. Open OBS Studio on Windows and choose the scene where you want the phone picture.
2. In **Sources**, click **+**, choose **Video Capture Device**, and create a source named VCam or Phone camera.
3. In the source properties, choose **VCam** from the Device list. Start with the default resolution and frame rate.
4. Confirm that the picture is moving. Resize or position the source in your scene.
5. Make a short local recording before using the scene in a stream or call.

If OBS was open during installation, close and reopen it so it can discover the virtual camera. VCam's installer includes components for compatible 32-bit and 64-bit camera applications. OBS on macOS or Linux cannot use the current Windows receiver.

## Set resolution, rotation and framing

Select a supported camera mode in VCam first. Then, if needed, set a matching custom resolution and frame rate in the OBS source properties. Start with 1080p30 or 720p30 when available. Higher modes increase the work done by the phone, network and computer; up to 4K and 60 FPS are conditional, and 4K60 is not guaranteed.

Use VCam for rotation or mirroring, or apply a transform to the source in OBS. Avoid mirroring twice. For a vertical phone, rotate the image deliberately and check how it fits the scene rather than stretching it. Keep the phone on a stable stand and aim a soft light at the subject.

## Add sound separately

VCam currently sends video only. Choose a computer microphone or another audio device in OBS. Check that the OBS audio meter responds to speech and avoid adding the same microphone twice. Record a short clip with a hand clap to check picture and sound alignment before adding any sync offset; the useful offset depends on your actual setup.

## Diagnose a black or frozen picture

If the VCam receiver is black, fix the phone connection first. If the receiver is live but OBS is black, check the Device selection and source properties, try the default mode, or close and reopen the source or OBS. Ensure the phone is still unlocked and displaying the camera page. Reduce the mode and test the Wi-Fi link if frames freeze.

The video connection runs directly between your devices, while the server helps pair them. See [product and privacy details](/en/about). These instructions describe VCam's Windows beta, rather than a claim of universal device compatibility. The source type and controls follow the [official OBS Video Capture Device documentation](https://obsproject.com/kb/video-capture-sources).`},
 {slug:'wifi-webcam-troubleshooting',ru:'wifi-kachestvo-zaderzhka',title:'Fix phone webcam lag and Wi-Fi connection problems',description:'A practical VCam checklist for failed pairing, frozen video and delay: local Wi-Fi isolation, camera permissions, resolution, phone heat and audio.',body:`A phone webcam can fail at different stages: opening the phone camera, pairing the devices, receiving the stream, or using the virtual camera in another application. Check those stages in order. Changing every setting at once makes it harder to see what helped.

## Identify where the problem starts

If the phone has no camera preview, check camera permission and whether another application is using it. If the phone preview works but the Windows receiver is waiting, check pairing and the local network. If VCam shows moving video but OBS or a call application does not, check that application's camera selection rather than generating more pairing codes.

Use Safari on iPhone or Chrome on Android, keep the page visible, and use the official HTTPS [connection page](/en/connect). The Windows receiver requires 64-bit Windows 10 or Windows 11. VCam currently sends video only and has no dedicated USB mode.

## Check local network access

Connect the phone and computer to the same local Wi-Fi network. A guest network can prevent devices from reaching each other even when both can access the internet. Look for client isolation, AP isolation or guest-device separation in your network configuration. Test on a normal trusted local network without those restrictions.

Temporarily test without a VPN if it changes local routing. Do not disable security controls broadly or expose the camera to the internet. VCam uses a direct WebRTC video connection and currently has no TURN relay to carry the video when direct connectivity is unavailable. Internet access is still needed to open the site and exchange pairing information.

## Retry pairing with a fresh code

Open VCam on Windows and click **Show QR code**. Each QR and eight-character code can be used once and expires after ten minutes. If it was used, expired or belongs to an old receiver session, create a new one. Scan the new QR or enter its code on the phone. Keep the code private and do not include it in public issue reports.

Repeatedly clicking connect cannot fix device isolation or a denied camera permission. Resolve the underlying issue before retrying. See the [iPhone setup](/en/guides/iphone-webcam-windows) or [Android setup](/en/guides/android-webcam-windows) for the full sequence.

## Reduce load when video stutters

Start at 720p30 or 1080p30, if the camera confirms that mode. Turn off downloads or other heavy network traffic during a short comparison. Move closer to the access point and try a less congested band where available. A 5 GHz network may help in some setups, but distance, walls and interference still matter.

Increase only one setting at a time after video becomes stable. 4K and 60 FPS require more capacity and are not guaranteed on every phone, browser or computer. The destination application can impose additional limits. Watch the actual stream statistics in VCam instead of treating the selected preset as a measurement of the final call quality.

## Keep the phone running comfortably

Keep its screen unlocked and the camera page in the foreground. Locking the phone or switching apps can pause capture. Secure the phone on a stand with ventilation and reduce capture quality if it becomes hot. You can minimize the Windows receiver without intentionally stopping the stream.

## Test the final output

Select VCam in the destination application's camera settings and restart that program after installing the virtual camera if needed. Make a short test recording in [OBS](/en/guides/phone-camera-obs) or a test call. Choose a separate microphone because VCam does not transmit phone audio. Check synchronization from a recording before applying a microphone delay.

If a reproducible problem remains, [report it on GitHub](https://github.com/prodbyEDDY/vcam/issues) with phone model, browser and operating-system versions, VCam version, chosen mode, network type, and the stage that failed. Do not include a live QR or connection token.`}
] as const;
export const getGuide=(slug:string)=>guidesEn.find(g=>g.slug===slug);
