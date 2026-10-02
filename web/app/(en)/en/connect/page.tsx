import CameraApp from '@/components/camera-app';
export const metadata={title:'Connect your phone camera — VCam',description:'Scan the QR code or enter the one-time code from the VCam Windows app.',alternates:{canonical:'/en/connect'},robots:{index:false,follow:true}};
export default function Page(){return <CameraApp phoneMode locale="en"/>}
