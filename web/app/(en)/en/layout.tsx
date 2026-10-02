import RootHtml,{viewport} from '@/components/root-html';
import {pageMetadata} from '@/lib/seo';
export {viewport};
export const metadata={...pageMetadata('en','/en','VCam — Free Phone Webcam for Windows | iPhone & Android','Turn your iPhone or Android phone into a free webcam for Windows 10/11, OBS and Zoom. No phone app, ads, watermark or subscription. Connect over Wi-Fi.'),verification:{google:'NHR3FE646FZNT2fVgEm4EZ7AXeregMfOqQeR498yzG4'},applicationName:'VCam',authors:[{name:'EDDY',url:'https://prodbyeddy.com'}],manifest:'/en.webmanifest',icons:{icon:[{url:'/favicon.ico'},{url:'/brand/icon-32.png',sizes:'32x32'}],apple:'/brand/icon-180.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <RootHtml locale="en">{children}</RootHtml>}
