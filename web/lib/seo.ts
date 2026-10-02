import type {Metadata} from 'next';
import {SITE,GITHUB,DEVELOPER,VERSION,INSTALLER} from './product';
export type Locale='ru'|'en';
export const updated='2026-10-02';
export const translations:Record<string,string>={
 '/':'/en', '/download':'/en/download', '/about':'/en/about', '/blog':'/en/guides',
 '/blog/iphone-veb-kamera-windows':'/en/guides/iphone-webcam-windows',
 '/blog/android-veb-kamera-windows':'/en/guides/android-webcam-windows',
 '/blog/telefon-kamera-obs':'/en/guides/phone-camera-obs',
 '/blog/wifi-kachestvo-zaderzhka':'/en/guides/wifi-webcam-troubleshooting',
};
export function languageAlternates(path:string){
 const ru=translations[path]?path:Object.keys(translations).find(k=>translations[k]===path);
 return ru?{canonical:path,languages:{ru, en:translations[ru],'x-default':translations[ru]}}:{canonical:path};
}
export function pageMetadata(locale:Locale,path:string,title:string,description:string):Metadata{
 return {metadataBase:new URL(SITE),title,description,alternates:languageAlternates(path),robots:{index:true,follow:true,'max-image-preview':'large'},openGraph:{type:'website',locale:locale==='en'?'en_US':'ru_RU',alternateLocale:locale==='en'?'ru_RU':'en_US',url:path,siteName:'VCam',title,description,images:[{url:'/images/social.jpg',width:1200,height:630,alt:locale==='en'?'A phone used as a webcam for a Windows computer':'Телефон как веб-камера для компьютера Windows'}]},twitter:{card:'summary_large_image',title,description,images:['/images/social.jpg']}};
}
export function applicationSchema(locale:Locale){return {
 '@context':'https://schema.org','@graph':[
 {'@type':'Person','@id':SITE+'/#developer',name:'EDDY',url:DEVELOPER,sameAs:['https://github.com/prodbyEDDY']},
 {'@type':'WebSite','@id':SITE+'/#website',url:SITE,name:'VCam',inLanguage:['ru','en'],publisher:{'@id':SITE+'/#developer'}},
 {'@type':'SoftwareApplication','@id':SITE+'/#application',name:'VCam',url:SITE+(locale==='en'?'/en':'/'),applicationCategory:'MultimediaApplication',applicationSubCategory:'Virtual webcam',operatingSystem:'Windows 10 (64-bit), Windows 11',softwareVersion:VERSION,downloadUrl:INSTALLER,codeRepository:GITHUB,isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'USD',url:SITE+(locale==='en'?'/en/download':'/download')},author:{'@id':SITE+'/#developer'},image:SITE+'/images/social.jpg',inLanguage:['ru','en'],featureList:['iPhone Safari and Android Chrome camera','QR code or one-time connection code','DirectShow virtual camera for Windows','Direct encrypted WebRTC video over local Wi-Fi','No phone app, ads, watermark or subscription'],description:locale==='en'?'VCam is a free Windows app that turns an iPhone or Android phone into a webcam through its browser. Video only; same local Wi-Fi network required.':'VCam — бесплатное приложение для Windows: iPhone или Android как веб-камера через браузер. Без приложения на телефоне, рекламы и водяного знака. Только видео; нужна одна локальная сеть Wi-Fi.'}
 ]};}
