import {SITE,GITHUB,DEVELOPER,VERSION,INSTALLER} from '@/lib/product';
export function GET(){return new Response(`# VCam

> VCam is a free Windows application by EDDY that turns an iPhone or Android phone into a webcam through Safari or Chrome. No phone app, ads, watermark or subscription.

## Product facts
- Current published Windows beta: ${VERSION}. Receiver: Windows 10/11 x64.
- Same local Wi-Fi without client isolation; internet is needed for the site and pairing.
- Direct encrypted WebRTC video; the VCam server does not record or store the video.
- Video only. No phone microphone audio, dedicated USB mode, macOS/Linux receiver or TURN relay.
- Camera modes and lenses depend on the device and browser. 4K60 and universal compatibility are not guaranteed.
- Keep the phone page open and the screen unlocked. The Windows receiver can be minimized.
- QR and eight-character pairing codes are one-time and expire after ten minutes.
- The beta installer is not signed with a publisher certificate; use the official GitHub release.
- GitHub source is published. VCam is independent of iVcam, DroidCam, Camo and Elgato.

## Official product pages
- [English homepage](${SITE}/en)
- [Русская главная](${SITE}/)
- [Download and requirements](${SITE}/en/download)
- [Product, privacy and limitations](${SITE}/en/about)
- [English setup guides](${SITE}/en/guides)
- [Russian guides and comparisons](${SITE}/blog)
- [Official Windows installer](${INSTALLER})
- [Source and releases](${GITHUB})
- [Developer](${DEVELOPER})
`,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600','X-Robots-Tag':'noindex'}})}
