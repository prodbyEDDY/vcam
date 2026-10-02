# Third-party notices

VCam's original code and documentation are licensed under the [MIT License](LICENSE), copyright (c) 2026 prodbyEDDY. Third-party components, fonts and marks retain their own licenses and notices described below.

VCam's DirectShow camera is based on UnityCapture by Bernhard Schelling and UnityCam by MHD Yamen Saraiji.
Source: https://github.com/schellingb/UnityCapture at commit 3ed54c325e0ad71afcf4f246c07e5e17b3d7f2d2.
The filter and its source files are distributed under the MIT license included in native/UnityCaptureFilter.cpp. Original copyright notices are retained. The DirectShow base classes retain Microsoft notices in streams.cpp and streams.h.

VCam modifications: distinct CLSIDs and shared-memory names (no collision with UnityCapture), friendly name VCam, black inactive output, synchronization handle permissions, mapped-view cleanup, native pipe sender, validation, build configuration and packaging.

Electron, Chromium, React, Radix, Lucide, QRCode and the remaining npm dependencies retain their respective licenses in the application distribution and dependency packages. Electron includes LICENSE.electron.txt and LICENSES.chromium.html.

Inter Variable is bundled under the SIL Open Font License 1.1. Its license is in web/public/fonts/LICENSE.txt; source: https://github.com/rsms/inter.

Browser/application brand SVGs in web/public/brands are from Simple Icons (https://github.com/simple-icons/simple-icons, CC0). Brand names and marks remain property of their respective owners; their appearance identifies platforms and compatible tools, not sponsorship or certification. The Windows mark is a simple four-pane identifier.

VCam mockups and the violet V icon were generated with OpenAI ImageGen using the project owner's Respo mockups as visual references. Prompt and asset provenance: docs/IMAGEGEN.md. Mockups illustrate the product; they are not compatibility or performance measurements.

- jsQR (Apache-2.0), https://github.com/cozmo/jsQR — browser QR decoding.
- electron-updater (MIT), https://github.com/electron-userland/electron-builder — Windows update delivery.
