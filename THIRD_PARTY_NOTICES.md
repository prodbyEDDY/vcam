# Third-party notices

VCam's DirectShow camera is based on UnityCapture by Bernhard Schelling and UnityCam by MHD Yamen Saraiji.
Source: https://github.com/schellingb/UnityCapture at commit 3ed54c325e0ad71afcf4f246c07e5e17b3d7f2d2.
The filter and its source files are distributed under the MIT license included in native/UnityCaptureFilter.cpp. Original copyright notices are retained. The DirectShow base classes retain Microsoft notices in streams.cpp and streams.h.

VCam modifications: distinct CLSIDs and shared-memory names (no collision with UnityCapture), friendly name VCam, black inactive output, synchronization handle permissions, mapped-view cleanup, native pipe sender, validation, build configuration and packaging.

Electron, Chromium, React, Radix, Lucide, QRCode and the remaining npm dependencies retain their respective licenses in the application distribution and dependency packages. Electron includes LICENSE.electron.txt and LICENSES.chromium.html.
