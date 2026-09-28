import type { Metadata } from "next";
import "./globals.css";
import "./camera.css";
import "./product.css";
import "./landing.css";

export const metadata: Metadata = {
  metadataBase:new URL('https://vcam.prodbyeddy.chatgpt.site'),
  title: "VCam — бесплатная альтернатива iVcam без рекламы",
  description: "Используй камеру iPhone или Android в Windows. VCam — бесплатная альтернатива iVcam без рекламы и водяных знаков. Подключение по QR или коду, без приложения на телефоне.",
  alternates:{canonical:'/'},
  applicationName:'VCam',authors:[{name:'EDDY',url:'https://prodbyeddy.com'}],
  robots:{index:true,follow:true},
  manifest:'/site.webmanifest',
  openGraph:{type:'website',locale:'ru_RU',url:'/',siteName:'VCam',title:'VCam — камера телефона для Windows',description:'Бесплатная альтернатива iVcam. Без рекламы. Без приложения на телефоне.',images:[{url:'/images/social.jpg',width:1200,height:630,alt:'Телефон снимает человека для видеозвонка на компьютере'}]},
  twitter:{card:'summary_large_image',title:'VCam — бесплатная веб-камера из телефона',description:'Для Windows. По QR или коду. Без рекламы и приложения на телефоне.',images:['/images/social.jpg']},
  icons: {
    icon: [{url:'/favicon.ico'},{url:'/brand/icon-32.png',type:'image/png',sizes:'32x32'}],
    shortcut: "/favicon.ico",
    apple:[{url:'/brand/icon-180.png',sizes:'180x180'}],
  },
};
export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#111113'};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}

