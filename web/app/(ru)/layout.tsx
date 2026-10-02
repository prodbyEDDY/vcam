import RootHtml,{viewport} from '@/components/root-html';
import {pageMetadata} from '@/lib/seo';
export {viewport};
export const metadata={...pageMetadata('ru','/','VCam — телефон как веб-камера для Windows бесплатно','Используйте iPhone или Android как веб-камеру для Windows 10/11 в OBS, Zoom и видеозвонках. VCam бесплатен: без приложения на телефоне, рекламы и водяного знака.'),verification:{google:'NHR3FE646FZNT2fVgEm4EZ7AXeregMfOqQeR498yzG4'},applicationName:'VCam',authors:[{name:'EDDY',url:'https://prodbyeddy.com'}],manifest:'/site.webmanifest',icons:{icon:[{url:'/favicon.ico'},{url:'/brand/icon-32.png',sizes:'32x32'}],apple:'/brand/icon-180.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <RootHtml locale="ru">{children}</RootHtml>}
