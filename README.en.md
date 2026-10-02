<div align="center">
  <img src="web/public/brand/icon-192.png" width="88" height="88" alt="VCam" />
  <h1>VCam</h1>
  <p><strong>Free iPhone and Android webcam for Windows</strong></p>
  <p>No phone app, ads, subscription or watermark.</p>
  <p><a href="https://vcam.prodbyeddy.chatgpt.site/en">Website</a> · <a href="https://github.com/prodbyEDDY/vcam/releases">Windows releases</a> · <a href="README.md">Русский</a></p>
</div>

VCam creates a Windows DirectShow virtual camera from your phone's browser video. Install the receiver on Windows, connect your iPhone through Safari or Android phone through Chrome, and select VCam in OBS, Zoom or another compatible application. Video travels directly between the devices over encrypted WebRTC. The server serves the website and helps pair them; it does not record or store the video.

## Set up a phone webcam

1. Install VCam on 64-bit Windows 10 or Windows 11. Administrator permission is needed to register the camera.
2. Connect the computer and phone to the same local Wi-Fi network without device isolation. Internet is needed to open the site and pair.
3. Open VCam and click **Show QR code**. Scan with the phone camera and open the link in Safari or Chrome, or enter the eight-character code at [Connect phone](https://vcam.prodbyeddy.chatgpt.site/en/connect).
4. Allow camera access. Keep the phone page open and screen unlocked.
5. Select **VCam** in the destination application's camera settings. Choose a separate microphone for audio.

QR codes and typed codes are single-use and expire after ten minutes. Restart a camera application after installation if it does not list the new virtual camera.

## Features

- Free access to all implemented features, with no ads, watermark, subscription or software time limit.
- Switch among the cameras and lenses exposed by the phone browser.
- Confirmed camera modes, including up to 4K and 60 FPS where supported. 4K60 is not guaranteed.
- Receiver controls for zoom, rotation, mirroring, composition grid and pause. Focus, exposure and torch depend on browser capabilities.
- The Windows receiver can keep streaming while minimized.
- Automatic updates in installed VCam 0.2.1 and newer: daily checks in 0.2.4 and newer, with the last check saved across restarts, background download, installation after closing the app.
- English and Russian UI in 0.2.3: system-language default and a saved language choice in **Settings → Language**.

## Current beta limitations

Windows receiver only; no macOS/Linux receiver, dedicated USB mode, phone microphone audio or TURN relay. Camera settings depend on the phone and browser. Compatibility with every device and application has not been tested. The beta installer is not yet signed with a publisher certificate; download only from the official repository's Releases page.

VCam is an independent project and is not affiliated with iVcam, DroidCam, Camo or Elgato. Source is published here; third-party component notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Guides and support

- [iPhone webcam on Windows](https://vcam.prodbyeddy.chatgpt.site/en/guides/iphone-webcam-windows)
- [Android webcam on Windows](https://vcam.prodbyeddy.chatgpt.site/en/guides/android-webcam-windows)
- [Phone camera in OBS](https://vcam.prodbyeddy.chatgpt.site/en/guides/phone-camera-obs)
- [Wi-Fi troubleshooting](https://vcam.prodbyeddy.chatgpt.site/en/guides/wifi-webcam-troubleshooting)
- [Product and privacy details](https://vcam.prodbyeddy.chatgpt.site/en/about)
- [Report an issue](https://github.com/prodbyEDDY/vcam/issues) · [Developer: EDDY](https://prodbyeddy.com)

Include device model and software versions in an issue. Do not post an active QR code or connection token.

## Development

See [DEVELOPMENT.md](docs/DEVELOPMENT.md) for the Windows build toolchain, Electron receiver, shared React camera interface and DirectShow components. Run `npm test`, `npm run build:ui`, and `npm run dist` for the application. `scripts/localization-smoke.cjs` checks the native interface with an isolated profile and no production pairing or real camera. Website checks are `web/scripts/check-blog.mjs` and `web/scripts/check-seo.mjs` against a running preview.
