'use client';
import {useEffect,useState} from 'react';
import {ArrowRight,ArrowUpRight,Wifi,ScanLine,SlidersHorizontal,ShieldCheck,Monitor,Check,Video,Smartphone} from 'lucide-react';
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from '@/components/ui/accordion';
import {DownloadActions,HelpButton} from './product-actions';
import CameraApp from './camera-app';
import {GITHUB,DEVELOPER} from '@/lib/product';
import {DownloadCount} from './download-count';
export const faqs=[
 ['VCam полностью бесплатный?','Да. Все настройки доступны бесплатно. В приложении нет рекламы, подписки и водяного знака. Исходный код опубликован на GitHub. VCam — независимая альтернатива iVcam, не связанная с его разработчиком.'],
 ['Нужно устанавливать приложение на телефон?','Нет. Установи VCam на компьютер с Windows. На iPhone открой ссылку из QR-кода в Safari, на Android — в Chrome. Разреши браузеру использовать камеру.'],
 ['Какие компьютеры и программы поддерживаются?','VCam работает на 64-битной Windows 10 и 11. Камеру можно выбрать в OBS, Zoom и других программах с поддержкой DirectShow. Доступные режимы зависят от телефона и браузера; совместимость со всеми моделями пока не проверена.'],
 ['Доступны ли 4K, 60 кадров/с и переключение объективов?','Приложение проверяет камеру и предлагает доступные сочетания разрешения и частоты кадров. Работа в 4K при 60 кадрах/с не гарантируется: она зависит от телефона, браузера, сети и компьютера. Safari может не предоставлять доступ ко всем объективам и ручным настройкам.'],
 ['Передаётся ли видео на сервер?','Нет. Видео передаётся напрямую с телефона на компьютер по зашифрованному соединению. Сервер нужен для открытия сайта и подключения устройств. Компьютер и телефон должны быть в одной сети Wi-Fi без изоляции устройств.'],
 ['Как подключиться без QR-кода?','Открой VCam на компьютере и нажми «Показать QR-код». На этом сайте с телефона нажми «Попробовать» и введи восемь символов из Windows-приложения. Код действует десять минут и используется один раз.'],
 ['Нужно держать страницу на телефоне открытой?','Да. Оставь страницу камеры открытой, а экран телефона — разблокированным. При сворачивании браузера система может остановить съёмку. Windows-приложение сворачивать можно.'],
 ['Передаётся ли звук с телефона?','Пока нет. VCam передаёт только видео. Для звука выбери микрофон компьютера или отдельный микрофон в программе для звонков или записи.'],
 ['Почему Windows показывает предупреждение об издателе?','Установщик пока не подписан сертификатом издателя. Скачивай VCam из раздела Releases официального репозитория на GitHub. Для установки виртуальной камеры нужны права администратора.']
];
const steps=[
 {Icon:Monitor,title:'Установи VCam на компьютер',text:'Открой приложение в Windows и нажми «Показать QR-код». Появятся QR-код и код подключения.'},
 {Icon:ScanLine,title:'Открой камеру на телефоне',text:'Отсканируй QR-код, открой ссылку и разреши доступ к камере. Если QR не работает, введи код на сайте.'},
 {Icon:Video,title:'Выбери VCam в программе',text:'В настройках камеры Zoom, OBS или другой программы выбери VCam. Страница на телефоне должна оставаться открытой.'}
];
export default function SiteHome(){
 const [pairing,setPairing]=useState(false);
 useEffect(()=>{const update=()=>setPairing(new URLSearchParams(location.hash.slice(1)).has('room')||new URLSearchParams(location.search).has('camera'));update();window.addEventListener('hashchange',update);return()=>window.removeEventListener('hashchange',update)},[]);
 if(pairing)return <CameraApp phoneMode/>;
 return <div className="landing"><a className="skip-link" href="#main">К содержимому</a>
 <header className="site-nav">
  <a className="brand" href="/" aria-label="VCam — главная"><img src="/brand/icon-64.png" width="36" height="36" alt=""/>VCam</a>
  <nav aria-label="Разделы сайта"><a href="#features">Возможности</a><a href="#setup">Инструкция</a><a href="#faq">Вопросы</a><a href="/blog">Блог</a></nav>
  <div className="nav-actions"><a className="github-button" href={GITHUB} target="_blank" rel="noreferrer"><img src="/brands/github.svg" width="22" height="22" alt=""/>GitHub</a><a href="/connect" className="nav-connect"><ScanLine size={18}/>Попробовать</a></div>
 </header>
 <main id="main">
  <section className="landing-hero">
   <h1>Камера телефона<br/><span>для Windows</span></h1>
   <p className="hero-description">Используй iPhone или Android как веб-камеру в Zoom, OBS и других программах. На телефоне достаточно открыть ссылку.</p>
   <div className="hero-terms"><span><Check size={16}/>Бесплатно</span><span><Check size={16}/>Без рекламы</span><span><Check size={16}/>Без водяного знака</span></div>
   <div className="hero-actions" id="download"><DownloadActions/></div>
   <div className="hero-meta"><DownloadCount/><HelpButton label/></div>
   <figure className="hero-image"><img src="/images/vcam-office.webp" width="1672" height="941" fetchPriority="high" alt="Телефон на подставке снимает человека за ноутбуком; его изображение открыто в VCam"/><figcaption className="hero-specs"><div><strong><small>до</small> 4K</strong><span>Разрешение видео</span></div><div><strong><small>до</small> 60 <small>кадров/с</small></strong><span>Частота кадров</span></div><div><Wifi size={25}/><span>Передача по Wi-Fi</span></div></figcaption></figure>
   <p className="quality-footnote">Разрешение и частота кадров зависят от устройства и браузера. VCam показывает доступные режимы.</p>
  </section>
  <section className="compatibility" aria-label="Устройства и приложения"><div className="brand-strip">{[['windows','Windows'],['apple','iPhone'],['safari','Safari'],['android','Android'],['googlechrome','Chrome'],['obsstudio','OBS'],['zoom','Zoom']].map(([icon,label])=><span key={icon}><img src={`/brands/${icon}.svg`} width="26" height="26" alt=""/>{label}</span>)}</div><p>На iPhone — Safari, на Android — Chrome.<br/>На компьютере — программы с поддержкой виртуальных камер DirectShow.</p></section>
  <section className="feature-section" id="features">
   <div className="section-heading"><h2>Все функции бесплатны</h2><p>Без подписки, рекламы и платных настроек.</p></div>
   <div className="feature-grid">
    <article className="free-feature"><div className="free-price">0 <span>₽</span></div><h3>Без оплаты</h3><ul><li><Check/>Любое доступное качество видео</li><li><Check/>Без ограничения времени</li><li><Check/>Без водяного знака</li><li><Check/>Без рекламных баннеров</li></ul><a href={GITHUB} target="_blank" rel="noreferrer"><img src="/brands/github.svg" width="19" height="19" alt=""/>Открытый исходный код<ArrowUpRight size={17}/></a></article>
    <article className="controls-feature"><SlidersHorizontal/><h3>Настройки камеры<br/>на компьютере</h3><p>Переключай камеры, меняй зум, разрешение и частоту кадров в VCam. Доступны поворот и зеркальное отражение.</p><div className="control-labels" aria-label="Настройки"><span>Зум</span><span>Поворот</span><span>Качество</span><span>Объективы</span></div><small>Список настроек зависит от камеры и браузера телефона.</small></article>
    <article className="connection-feature"><Smartphone/><h3>На телефоне — только браузер</h3><p>Открой ссылку из QR-кода и разреши доступ к камере. Устанавливать приложение на телефон не нужно.</p><a href="/connect">Ввести код подключения<ArrowRight size={17}/></a></article>
    <article className="privacy-feature"><ShieldCheck/><h3>Видео не попадает на сервер</h3><p>Зашифрованный видеопоток передаётся напрямую между устройствами. VCam не записывает и не хранит видео.</p><div className="connection-diagram"><Smartphone size={18}/><span>Телефон</span><span className="connection-line"/><Wifi size={18}/><span className="connection-line"/><Monitor size={18}/><span>ПК</span></div></article>
   </div>
  </section>
  <section className="setup-section" id="setup"><div className="section-heading"><h2>Как настроить VCam</h2><p>Подключи компьютер и телефон к одной сети Wi-Fi.</p></div><div className="setup-steps">{steps.map(({Icon,title,text},i)=><article key={title}><div className="setup-step-top"><span>{i+1}</span><Icon size={26}/></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
  <section className="faq-section" id="faq"><h2>Вопросы<br/>и ответы</h2><Accordion type="single" collapsible>{faqs.map(([q,a],i)=><AccordionItem value={String(i)} key={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent>{a}</AccordionContent></AccordionItem>)}</Accordion></section>
  <section className="home-blog"><div><h2>Инструкции и сравнения</h2><a href="/blog">Все статьи<ArrowUpRight size={19}/></a></div><div className="home-blog-grid">{[['ivcam-alternativa','Бесплатная альтернатива iVcam'],['iphone-veb-kamera-windows','iPhone как веб-камера Windows'],['telefon-kamera-obs','Как добавить телефон в OBS']].map(([slug,title])=><a key={slug} href={`/blog/${slug}`}><img src={`/images/blog/${slug}.webp`} alt="" width="1600" height="900" loading="lazy"/><h3>{title}</h3></a>)}</div></section>
  <section className="last-call"><img src="/brand/icon-64.png" width="54" height="54" alt=""/><h2>Скачать VCam<br/>для Windows</h2><DownloadActions/><a href="/connect" className="simple-link">Ввести код из приложения<ArrowRight size={16}/></a></section>
  <section className="developer-section"><a href={DEVELOPER} target="_blank" rel="noreferrer">Связаться с разработчиком<ArrowUpRight/></a><span>prodbyeddy.com</span></section>
 </main><footer className="site-footer"><span>VCam · Бесплатно и без рекламы</span><a href={GITHUB} target="_blank" rel="noreferrer">Исходный код<ArrowUpRight size={14}/></a><span>Разработчик — EDDY</span></footer></div>;
}
