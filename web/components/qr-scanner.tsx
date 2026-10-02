'use client';
import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import {Camera,LoaderCircle} from 'lucide-react';
import {translate,type Locale} from '@/lib/i18n';
import {parsePairingQr} from '@/lib/pairing-qr.mjs';

export default function QrScanner({onPair,stopRef,locale='ru'}:{locale?:Locale;onPair:(pair:{id:string;token:string})=>void;stopRef:MutableRefObject<()=>void>}){
 const t=(text:string)=>translate(text,locale);
 const video=useRef<HTMLVideoElement>(null),onPairRef=useRef(onPair);
 const [attempt,setAttempt]=useState(0),[state,setState]=useState<'opening'|'scanning'|'blocked'>('opening'),[message,setMessage]=useState('');
 onPairRef.current=onPair;
 useEffect(()=>{
  let stopped=false,stream:MediaStream|undefined,timer:ReturnType<typeof setTimeout>;
  const stop=()=>{stopped=true;clearTimeout(timer);stream?.getTracks().forEach(t=>t.stop());if(video.current)video.current.srcObject=null};
  stopRef.current=stop;setState('opening');setMessage('');
  const hidden=()=>{if(document.hidden){stop();setState('blocked');setMessage('Камера приостановлена')}};
  document.addEventListener('visibilitychange',hidden);
  async function start(){
   try{
    if(!navigator.mediaDevices?.getUserMedia)throw Error('camera-unavailable');
    const decodePromise=import('jsqr');
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});
    if(stopped){stream.getTracks().forEach(t=>t.stop());return}
    const v=video.current;if(!v){stop();return}v.srcObject=stream;await v.play();
    const {default:decode}=await decodePromise;if(stopped)return;
    setState('scanning');
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true})!;
    const scan=()=>{
     if(stopped)return;
     if(v.readyState>=2&&v.videoWidth){
      // Decode the same square crop shown in the viewfinder.
      const side=Math.min(v.videoWidth,v.videoHeight);canvas.width=640;canvas.height=640;
      ctx.drawImage(v,(v.videoWidth-side)/2,(v.videoHeight-side)/2,side,side,0,0,640,640);
      const code=decode(ctx.getImageData(0,0,640,640).data,640,640,{inversionAttempts:'dontInvert'});
      if(code){const pair=parsePairingQr(code.data,location.origin);if(pair){stop();onPairRef.current(pair as {id:string;token:string});return}setMessage('Нужен QR-код из приложения VCam')}
     }
     timer=setTimeout(scan,220);
    };scan();
   }catch(e){if(stopped)return;stream?.getTracks().forEach(t=>t.stop());setState('blocked');setMessage((e as Error)?.name==='NotAllowedError'?'Разреши доступ к камере или введи код ниже':'Не удалось включить камеру. Можно ввести код ниже.')}
  }
  void start();
  return()=>{stop();document.removeEventListener('visibilitychange',hidden);if(stopRef.current===stop)stopRef.current=()=>{}};
 },[attempt,stopRef]);
 return <div className="scanner-block"><div className={`qr-scanner ${state}`}>
  <video ref={video} autoPlay muted playsInline aria-label={t("Камера для сканирования QR-кода")}/>
  {state==='scanning'?<div className="scan-corners" aria-hidden="true"><i/><i/><i/><i/></div>:<div className="scanner-prompt">{state==='opening'?<><LoaderCircle className="spin" size={28}/><span>{t("Открываем камеру…")}</span></>:<><Camera size={30}/><button type="button" className="primary-button" onClick={()=>setAttempt(a=>a+1)}>{t("Включить камеру")}</button></>}</div>}
 </div><p className="scanner-caption" role="status">{t(message)||t('Наведи на QR-код в VCam на компьютере')}</p></div>;
}
