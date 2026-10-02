import {AboutPage} from '@/components/product-pages';
import {pageMetadata} from '@/lib/seo';
export const metadata=pageMetadata('ru','/about','О VCam — возможности, приватность и разработчик','Как работает бесплатная камера телефона VCam для Windows: прямое видео WebRTC, приватность, поддерживаемые устройства, ограничения и поддержка.');
export default function Page(){return <AboutPage locale="ru"/>}
