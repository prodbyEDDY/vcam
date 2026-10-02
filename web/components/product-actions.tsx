'use client';
import {useState} from 'react';
import {translate,type Locale} from '@/lib/i18n';
import {ArrowUpRight,Download,Share2,Star,Check,Monitor,ScanLine,Video,HelpCircle,X} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {GITHUB,INSTALLER,RELEASE} from '@/lib/product';

export function HelpButton({label=false,locale='ru'}:{label?:boolean;locale?:Locale}){
 const t=(text:string)=>translate(text,locale);
 const [open,setOpen]=useState(false);
 return <><button className={label?'help-link':'help-button'} aria-label={t("Как подключить телефон")} onClick={()=>setOpen(true)}><HelpCircle size={20}/>{label&&t('Как подключить')}</button><Dialog open={open} onOpenChange={setOpen}><DialogContent className="product-dialog help-dialog" showCloseButton={false}><button className="dialog-x" aria-label={t("Закрыть инструкцию")} onClick={()=>setOpen(false)}><X size={21}/></button><DialogTitle>{t("Как настроить VCam")}</DialogTitle><DialogDescription>{t("Подключи компьютер и телефон к одной сети Wi-Fi.")}</DialogDescription><div className="help-steps">{[
 {Icon:Monitor,title:t('Открой VCam на Windows'),text:t('Установи приложение и нажми «Показать QR-код». На экране появятся QR и код.')},
 {Icon:ScanLine,title:t('Подключи телефон'),text:t('Отсканируй QR обычной камерой и открой ссылку. Разреши доступ к камере. Или открой сайт VCam и введи код из приложения.')},
 {Icon:Video,title:t('Выбери камеру VCam'),text:t('В Zoom, OBS или другом приложении выбери VCam в списке камер. Оставь страницу открытой на телефоне.')}
 ].map(({Icon,title,text},i)=><article className="help-step" key={title}><span className="step-number">0{i+1}</span><Icon size={25}/><h3>{title}</h3><p>{text}</p></article>)}</div><button className="action-primary" onClick={()=>setOpen(false)}>{t("Всё понятно")}</button></DialogContent></Dialog></>;
}

export function DownloadActions({compact=false,locale='ru'}:{compact?:boolean;locale?:Locale}){
 const t=(text:string)=>translate(text,locale);
 const [action,setAction]=useState<'download'|'share'|null>(null),[copied,setCopied]=useState(false),[message,setMessage]=useState('');
 async function share(){
  setMessage('');
  try{if(navigator.share){await navigator.share({title:t('VCam для Windows — бесплатно'),text:t('Камера телефона вместо веб-камеры. Без приложения на телефоне.'),url:RELEASE});setAction(null)}else{await navigator.clipboard.writeText(RELEASE);setCopied(true)}}catch(e:any){if(e?.name!=='AbortError')setMessage(t('Скопируй ссылку ниже и отправь её себе.'))}
 }
 return <><div className={`download-actions ${compact?'compact':''}`}><button className="action-primary" onClick={()=>{setAction('download');setCopied(false)}}><Download size={19}/>{t("Скачать для Windows")}</button><button className="share-button" aria-label={t("Поделиться ссылкой на скачивание")} onClick={()=>{setAction('share');setCopied(false);setMessage('')}}><Share2 size={19}/></button></div><Dialog open={action!==null} onOpenChange={v=>{if(!v)setAction(null)}}><DialogContent className="product-dialog support-dialog" showCloseButton={false}><button className="dialog-x" aria-label={t("Закрыть окно поддержки")} onClick={()=>setAction(null)}><X size={21}/></button><span className="star-emblem"><Star size={32}/></span><DialogTitle>{t("Поддержать VCam")}</DialogTitle><DialogDescription>{t("VCam бесплатный и работает без рекламы. Если приложение пригодилось, можно поставить звезду на GitHub.")}</DialogDescription><a href={GITHUB} target="_blank" rel="noreferrer" className="github-star"><Star size={18}/>{t("Поставить звезду")}<ArrowUpRight size={17}/></a><p className="optional-note">{t("Звезда — по желанию. Для скачивания она не нужна.")}</p>{action==='download'?<a href={INSTALLER} className="action-primary" onClick={()=>setAction(null)}><Download size={19}/>{t("Скачать бесплатно")}</a>:<><button className="action-primary" onClick={share}>{copied?<Check size={19}/>:<Share2 size={19}/>} {copied?t('Ссылка скопирована'):t('Поделиться ссылкой')}</button>{(copied||message)&&<p role="status">{message||t('Можно отправить её себе в любом мессенджере.')}</p>}{message&&<a className="share-fallback" href={RELEASE}>{RELEASE}</a>}</>}</DialogContent></Dialog></>;
}
