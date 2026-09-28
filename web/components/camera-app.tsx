'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera,SwitchCamera,RotateCw,FlipHorizontal,ScanLine,Smartphone,Monitor,Download,Copy,Check,Maximize,Grid3X3,ArrowUpRight,Video,Settings2,Wifi,ChevronRight,LoaderCircle} from 'lucide-react';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import QRCode from 'qrcode';
import {CameraInfo,MODES} from '@/lib/camera';
import {CameraSession,EMPTY_INFO,SessionState,friendly} from '@/lib/session';
const DOWNLOAD='https://github.com/prodbyEDDY/vcam/releases/latest';
const PRESETS:Record<string,string>={continuous:'Авто',manual:'Вручную','single-shot':'Однократно',none:'Выкл.'};

export default function CameraApp(){
  const [phone,setPhone]=useState(false),[native,setNative]=useState(false),[ready,setReady]=useState(false);
  const [state,setState]=useState<SessionState>('idle'),[note,setNote]=useState(''),[error,setError]=useState('');
  const [link,setLink]=useState(''),[qr,setQr]=useState(''),[info,setInfo]=useState<CameraInfo>(EMPTY_INFO);
  const [busy,setBusy]=useState(false),[copied,setCopied]=useState(false),[mirror,setMirror]=useState(false),[rotation,setRotation]=useState(0);
  const [autoRotate,setAutoRotate]=useState(true),[grid,setGrid]=useState(false),[crop,setCrop]=useState(1),[zoom,setZoom]=useState(1);
  const [stats,setStats]=useState({fps:0,mbps:0}),[nativeState,setNativeState]=useState({installed:false,consumer:false,error:''});
  const [elapsed,setElapsed]=useState(0),[outputFrames,setOutputFrames]=useState(0);
  const video=useRef<HTMLVideoElement>(null),canvas=useRef<HTMLCanvasElement>(null),surface=useRef<HTMLDivElement>(null);
  const session=useRef<CameraSession|null>(null),auto=useRef(true),output=useRef({mirror:false,rotation:0,crop:1});
  const running=state==='live'||state==='paused';
  useEffect(()=>{
    const controller=new CameraSession({state:setState,note:setNote,error:setError,info:setInfo,link:setLink,busy:setBusy,
      stream:s=>{if(video.current){video.current.srcObject=s;if(s)void video.current.play().catch(()=>{})}},
      orientation:angle=>{if(auto.current&&video.current&&video.current.videoHeight>video.current.videoWidth)setRotation(angle===180?180:0)}
    });session.current=controller;
    const hash=new URLSearchParams(location.hash.slice(1));
    if(hash.get('room')&&hash.get('key')){controller.pair={id:hash.get('room')!,token:hash.get('key')!};controller.phone=true;setPhone(true);history.replaceState(null,'',location.pathname+'?camera=1')}
    else if(new URLSearchParams(location.search).has('camera')){setPhone(true);controller.phone=true}
    setNative(!!window.vcam);setReady(true);
    return()=>controller.stop(false);
  },[]);
  useEffect(()=>{let stale=false;if(!link){setQr('');return}void QRCode.toDataURL(link,{width:300,margin:2,errorCorrectionLevel:'M',color:{dark:'#111113',light:'#ffffff'}}).then(s=>{if(!stale)setQr(s)});return()=>{stale=true}},[link]);
  useEffect(()=>{setZoom((info.settings as any).zoom||1)},[info]);
  useEffect(()=>{output.current={mirror,rotation,crop};auto.current=autoRotate},[mirror,rotation,crop,autoRotate]);
  useEffect(()=>{
    if(!phone)return;let lastAngle=0;
    const orientation=()=>session.current?.send({type:'orientation',angle:screen.orientation?.angle??(window as any).orientation??0});
    const motion=(e:DeviceOrientationEvent)=>{if(e.beta===null||e.gamma===null)return;const b=e.beta*Math.PI/180,g=e.gamma*Math.PI/180,x=Math.sin(g)*Math.cos(b),y=Math.sin(b);if(Math.hypot(x,y)<0.45)return;const angle=(Math.round(Math.atan2(x,y)/(Math.PI/2))*90+360)%360;if(angle!==lastAngle){lastAngle=angle;session.current?.send({type:'orientation',angle})}};
    const visible=()=>{session.current?.send({type:'visibility',hidden:document.hidden});if(!document.hidden)void session.current?.wakeScreen()};
    screen.orientation?.addEventListener('change',orientation);window.addEventListener('orientationchange',orientation);window.addEventListener('deviceorientation',motion);document.addEventListener('visibilitychange',visible);
    return()=>{screen.orientation?.removeEventListener('change',orientation);window.removeEventListener('orientationchange',orientation);window.removeEventListener('deviceorientation',motion);document.removeEventListener('visibilitychange',visible)};
  },[phone]);
  useEffect(()=>{
    if(!running)return;const started=Date.now();let bytes=0,frames=0,time=0;
    const timer=setInterval(async()=>{
      setElapsed(Math.floor((Date.now()-started)/1000));const report=await session.current?.peer?.getStats().catch(()=>null);
      report?.forEach((r:any)=>{if(r.kind==='video'&&r.type===(phone?'outbound-rtp':'inbound-rtp')){const nb=r.bytesReceived??r.bytesSent??0,nf=r.framesDecoded??r.framesEncoded??0,dt=(r.timestamp-time)/1000;if(time&&dt>0)setStats({fps:Math.round((nf-frames)/dt),mbps:(nb-bytes)*8/dt/1000000});bytes=nb;frames=nf;time=r.timestamp}});
      if(window.vcam){const s=await window.vcam.status();setNativeState({...s,error:s.error||''})}
    },1000);return()=>clearInterval(timer);
  },[running,phone]);
  useEffect(()=>{if(native)void window.vcam?.status().then(s=>setNativeState({...s,error:s.error||''}))},[native]);
  useEffect(()=>{
    if(phone||!running)return;let cancelled=false,frames=0,last=performance.now(),raf=0;
    const draw=async()=>{
      const v=video.current,c=canvas.current;if(cancelled||!v||!c)return;
      if(v.readyState>=2&&v.videoWidth){
        const o=output.current,swap=o.rotation%180!==0,w=swap?v.videoHeight:v.videoWidth,h=swap?v.videoWidth:v.videoHeight;
        if(c.width!==w||c.height!==h){c.width=w;c.height=h}
        const ctx=c.getContext('2d',{willReadFrequently:!!window.vcam})!;
        ctx.save();ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);ctx.translate(w/2,h/2);if(o.mirror)ctx.scale(-1,1);ctx.rotate(o.rotation*Math.PI/180);ctx.scale(o.crop,o.crop);ctx.drawImage(v,-v.videoWidth/2,-v.videoHeight/2);ctx.restore();
        if(window.vcam&&state==='live'){try{await window.vcam.frame(w,h,ctx.getImageData(0,0,w,h).data.buffer as ArrayBuffer);frames++}catch(e){setNativeState(s=>({...s,error:friendly(e)}))}}
        if(performance.now()-last>=1000){setOutputFrames(frames);frames=0;last=performance.now()}
      }if(!cancelled)raf=requestAnimationFrame(draw);
    };raf=requestAnimationFrame(draw);return()=>{cancelled=true;cancelAnimationFrame(raf)};
  },[running,phone,state]);
  const command=(name:string,value:any,key?:string)=>void session.current?.command(name,value,key);
  const connect=()=>phone?void session.current?.connectPhone():void session.current?.host();
  const copy=async()=>{try{await navigator.clipboard.writeText(link);setCopied(true);setTimeout(()=>setCopied(false),2000)}catch{setError('Не удалось скопировать ссылку. Используй QR-код.')}};
  const fullscreen=()=>{if(surface.current?.requestFullscreen)void surface.current.requestFullscreen().catch(()=>{});else setError('Полноэкранный режим недоступен.')};
  const caps=info.capabilities,settings=info.settings as any;
  const currentMode=String(MODES.findIndex(m=>Math.max(settings.width||0,settings.height||0)===m[1]&&Math.abs((settings.frameRate||0)-m[3])<1));
  const time=`${Math.floor(elapsed/60).toString().padStart(2,'0')}:${(elapsed%60).toString().padStart(2,'0')}`;
  return <main className={`vcam ${phone?'phone-app':''}`}>
    <header className="topbar"><a className="brand" href="/" aria-label="VCam — главная"><span className="brand-icon"><Video size={20}/></span>VCam<span className="version">BETA</span></a><div className="top-status"><span className={`status-dot ${running?'on':''}`}/>{running?'Камера подключена':state==='pairing'?'Ожидаем iPhone':'Камера без проводов'}</div>{!phone&&<a className="download-link" href={DOWNLOAD} target="_blank" rel="noreferrer"><Download size={16}/><span>{native?'Релизы':'Для Windows'}</span></a>}</header>
    <div className="workspace"><section className="studio">
      <div className="section-heading"><div><span className="eyebrow">{phone?'КАМЕРА IPHONE':'ТВОЯ КАМЕРА'}</span><h1>{phone?'В кадре.':'Всё начинается с кадра.'}</h1></div><span className="section-label">{phone?'Safari':native?'Windows':'Веб-превью'}</span></div>
      <div className={`viewfinder ${running?'active':''}`} ref={surface}>
        <video ref={video} autoPlay playsInline muted className={phone?'phone-video':'source-video'}/>{!phone&&<canvas ref={canvas} className={`output-canvas ${running?'visible':''}`}/>}
        {running&&<><div className="view-top"><span className="live-pill"><span/>{state==='paused'?'ПАУЗА':'LIVE'}<span className="timer">{time}</span></span><span className="quality-pill">{settings.width?`${settings.width} × ${settings.height}`:'Видео'}{stats.fps>0?` · ${stats.fps} FPS`:''}</span></div>{grid&&<div className="grid-overlay"/>}<div className="view-bottom"><span><Smartphone size={15}/>{settings.facingMode==='user'?'Фронтальная камера':'Камера телефона'}</span><button aria-label="Полный экран" onClick={fullscreen}><Maximize size={19}/></button></div></>}
        {!running&&state!=='connecting'&&<div className="empty-view">{qr?<><div className="qr-frame"><img src={qr} width={240} height={240} alt="QR-код для подключения телефона"/></div><h2>Наведи камеру. И ты в кадре.</h2><p>Отсканируй QR на iPhone.<br/>Разреши камеру в открывшейся странице.</p><button className="text-button" onClick={copy}>{copied?<Check size={16}/>:<Copy size={16}/>} {copied?'Скопировано':'Скопировать ссылку'}</button><span className="small-note">Одно подключение · действует 10 минут</span></>:<><span className="empty-icon">{state==='opening'?<LoaderCircle className="spin" size={35}/>:phone?<Camera size={35}/>:<ScanLine size={35}/>}</span><h2>{state==='opening'?'Секунду…':phone?'Твой iPhone — твоя веб-камера.':'iPhone. Теперь веб-камера.'}</h2><p>{state==='opening'?note:phone?'Открой камеру и оставайся на этой странице.':'Подключи телефон по QR-коду.\nБез приложения на iPhone.'}</p><button className="primary-button" disabled={!ready||state==='opening'} onClick={connect}>{phone?<Camera size={18}/>:<ScanLine size={18}/>} {phone?'Открыть камеру':'Подключить iPhone'}</button>{!phone&&<span className="small-note">Телефон и компьютер в одной сети Wi-Fi</span>}</>}</div>}
        {state==='connecting'&&<div className="empty-view"><LoaderCircle size={35} className="spin"/><h2>Соединяемся…</h2><p>{note}</p></div>}
        <span className="corner tl"/><span className="corner tr"/><span className="corner bl"/><span className="corner br"/>
      </div>
      <div className="camera-toolbar"><div className="toolbar-group"><button className={`icon-button ${grid?'selected':''}`} aria-label="Сетка кадра" aria-pressed={grid} onClick={()=>setGrid(!grid)}><Grid3X3 size={21}/></button><button className="icon-button" aria-label="Переключить переднюю и заднюю камеру" disabled={!running||busy} onClick={()=>command('flip',null)}><SwitchCamera size={23}/></button></div><div className="capture-control"><button className={`shutter ${running?'recording':''}`} aria-label={running?state==='paused'?'Продолжить камеру':'Приостановить камеру':'Подключить камеру'} disabled={busy||['opening','connecting','pairing'].includes(state)} onClick={()=>running?command('pause',state!=='paused'):connect()}><span/></button><span>{running?state==='paused'?'Продолжить':'Пауза':'Подключить'}</span></div><div className="toolbar-group"><button className="icon-button" disabled={phone||!running} aria-label="Повернуть изображение на 90 градусов" onClick={()=>{setAutoRotate(false);setRotation(r=>(r+90)%360)}}><RotateCw size={21}/></button><button className={`icon-button ${mirror?'selected':''}`} disabled={phone||!running} aria-label="Отразить изображение" aria-pressed={mirror} onClick={()=>setMirror(!mirror)}><FlipHorizontal size={21}/></button></div></div>
      {(error||note&&running)&&<div className={error?'message error':'message'} role={error?'alert':'status'}>{error||note}</div>}{state!=='idle'&&<button className="disconnect" onClick={()=>session.current?.stop()}>{running?'Отключить телефон':'Отменить подключение'}</button>}
      <div className="studio-footer"><span><Wifi size={15}/>{running?`${stats.mbps.toFixed(1)} Мбит/с`:'Прямое соединение'}</span><span>Видео не сохраняется на сервере</span></div>
    </section>
    {!phone&&<aside className="controls"><div className="controls-title"><Settings2 size={19}/><h2>Настройки камеры</h2>{busy&&<LoaderCircle size={16} className="spin"/>}</div>
      <div className="control-section"><span className="control-label">УСТРОЙСТВО</span><div className="device-row"><span className="device-icon"><Smartphone size={27}/></span><div><strong>{running?'Телефон подключён':'Твой iPhone'}</strong><p>{running?'Управление с компьютера':'Появится после подключения'}</p></div><span className={`status-dot ${running?'on':''}`}/></div></div>
      <div className="control-section"><span className="control-label">ОБЪЕКТИВ</span>{info.devices.length?<Select value={settings.deviceId} onValueChange={v=>command('device',v)} disabled={busy}><SelectTrigger className="camera-select"><SelectValue/></SelectTrigger><SelectContent>{info.devices.map(d=><SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}</SelectContent></Select>:<p className="muted">Доступные камеры определятся при подключении.</p>}<div className="zoom-heading"><span>{caps.zoom?'Зум камеры':'Цифровое приближение'}</span><strong>{(caps.zoom?zoom:crop).toFixed(1)}×</strong></div><Slider aria-label={caps.zoom?'Зум камеры':'Цифровое приближение'} min={caps.zoom?.min||1} max={caps.zoom?.max||4} step={caps.zoom?.step||0.1} value={[caps.zoom?zoom:crop]} disabled={!running||busy} onValueChange={v=>caps.zoom?setZoom(v[0]):setCrop(v[0])} onValueCommit={v=>{if(caps.zoom)command('constraint',v[0],'zoom')}}/><div className="zoom-stops"><span>{caps.zoom?.min||1}×</span><span>{caps.zoom?.max||4}×</span></div></div>
      <div className="control-section"><span className="control-label">КАЧЕСТВО</span>{info.modes.length?<Select value={currentMode==='-1'?undefined:currentMode} onValueChange={v=>command('mode',v)} disabled={busy}><SelectTrigger className="camera-select"><SelectValue placeholder="Текущий режим"/></SelectTrigger><SelectContent>{info.modes.map(i=><SelectItem key={i} value={i}>{MODES[Number(i)][0]} FPS</SelectItem>)}</SelectContent></Select>:<div className="empty-setting"><span>Автоматически</span><ChevronRight size={16}/></div>}<p className="hint">{info.modes.length?'Режимы проверены на подключённой камере.':'Покажем режимы, которые поддерживает Safari.'}</p></div>
      <div className="control-section"><span className="control-label">КАДР</span><label className="toggle-row"><span>Автоповорот</span><Switch checked={autoRotate} onCheckedChange={setAutoRotate} aria-label="Автоповорот"/></label><label className="toggle-row"><span>Зеркальное отражение</span><Switch checked={mirror} onCheckedChange={setMirror} disabled={!running} aria-label="Зеркальное отражение"/></label></div>
      {['focusMode','exposureMode','whiteBalanceMode'].some(k=>Array.isArray(caps[k])&&caps[k].length>1)&&<div className="control-section"><span className="control-label">СЪЁМКА</span>{[['focusMode','Фокус'],['exposureMode','Экспозиция'],['whiteBalanceMode','Баланс белого']].map(([key,label])=>Array.isArray(caps[key])&&caps[key].length>1?<div className="additional-setting" key={key}><label>{label}</label><Select value={settings[key]} onValueChange={v=>command('constraint',v,key)} disabled={busy}><SelectTrigger className="camera-select"><SelectValue/></SelectTrigger><SelectContent>{caps[key].map((v:string)=><SelectItem key={v} value={v}>{PRESETS[v]||v}</SelectItem>)}</SelectContent></Select></div>:null)}</div>}
      {['exposureCompensation','focusDistance','colorTemperature'].map(key=>caps[key]&&caps[key].max>caps[key].min?<div className="control-section" key={key}><div className="zoom-heading"><span>{key==='exposureCompensation'?'Экспокоррекция':key==='focusDistance'?'Расстояние фокуса':'Температура'}</span><span>{settings[key]}</span></div><Slider aria-label={key} min={caps[key].min} max={caps[key].max} step={caps[key].step||0.1} defaultValue={[settings[key]??caps[key].min]} disabled={busy} onValueCommit={v=>command('constraint',v[0],key)}/></div>:null)}
      {caps.torch&&<div className="control-section"><label className="toggle-row"><span>Фонарик</span><Switch checked={!!settings.torch} onCheckedChange={v=>command('constraint',v,'torch')} disabled={busy} aria-label="Фонарик"/></label></div>}
      <div className="output-card"><span className="output-icon"><Monitor size={21}/></span><div><strong>{native?'VCam — виртуальная камера':'Камера для Windows'}</strong><p>{native?nativeState.error||(nativeState.installed?(nativeState.consumer?`Передаём в приложение · ${outputFrames} FPS`:'Выбери VCam в приложении для звонков'):'Нужна установка через VCam Setup'):'Для Zoom, OBS и других приложений установи VCam на компьютер.'}</p>{!native&&<a href={DOWNLOAD} target="_blank" rel="noreferrer">Скачать приложение <ArrowUpRight size={15}/></a>}</div></div>
    </aside>}
    {phone&&<div className="phone-note"><Smartphone size={18}/><p>Оставь эту страницу открытой.<br/>Настройки камеры — на компьютере.</p></div>}</div>
    <footer className="page-footer"><span>VCam</span><span>Без проводов. Без лишнего.</span><a href="https://github.com/prodbyEDDY/vcam" target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={13}/></a></footer>
  </main>;
}
