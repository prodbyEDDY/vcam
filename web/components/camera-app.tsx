'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera,SwitchCamera,RotateCw,FlipHorizontal,ScanLine,Download,Copy,Check,Maximize,Grid3X3,Settings2,LoaderCircle,X,Pause,Play,Link2} from 'lucide-react';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Sheet,SheetContent,SheetHeader,SheetTitle,SheetDescription} from '@/components/ui/sheet';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import QRCode from 'qrcode';
import {CameraInfo,MODES} from '@/lib/camera';
import {CameraSession,EMPTY_INFO,SessionState,friendly} from '@/lib/session';
const DOWNLOAD='https://github.com/prodbyEDDY/vcam/releases';
const PRESETS:Record<string,string>={continuous:'Авто',manual:'Вручную','single-shot':'Однократно',none:'Выкл.'};

export default function CameraApp(){
  const [phone,setPhone]=useState(false),[native,setNative]=useState(false),[ready,setReady]=useState(false);
  const [state,setState]=useState<SessionState>('idle'),[note,setNote]=useState(''),[error,setError]=useState('');
  const [link,setLink]=useState(''),[qr,setQr]=useState(''),[info,setInfo]=useState<CameraInfo>(EMPTY_INFO);
  const [busy,setBusy]=useState(false),[copied,setCopied]=useState(false),[mirror,setMirror]=useState(false),[rotation,setRotation]=useState(0);
  const [autoRotate,setAutoRotate]=useState(true),[grid,setGrid]=useState(false),[crop,setCrop]=useState(1),[zoom,setZoom]=useState(1);
  const [stats,setStats]=useState({fps:0,mbps:0}),[nativeState,setNativeState]=useState({installed:false,consumer:false,error:''});
  const [elapsed,setElapsed]=useState(0),[outputFrames,setOutputFrames]=useState(0);
  const [panel,setPanel]=useState(false);
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
  const quality=settings.width?(Math.max(settings.width,settings.height)>=3840?'4K':Math.max(settings.width,settings.height)>=1920?'HD':'720'):'АВТО';
  const controlsDisabled=!running||busy;
  const modePicker=<Select value={currentMode==='-1'?undefined:currentMode} onValueChange={v=>command('mode',v)} disabled={controlsDisabled||!info.modes.length}><SelectTrigger className="quality-select" aria-label="Качество видео"><span>{quality}{settings.frameRate?` · ${Math.round(settings.frameRate)}`:''}</span></SelectTrigger><SelectContent>{info.modes.map(i=><SelectItem key={i} value={i}>{MODES[Number(i)][0]} FPS</SelectItem>)}</SelectContent></Select>;
  return <main className={`vcam ${phone?'phone-app':''}`}>
    <header className="camera-header">
      <span className="app-name">VCam</span>
      <span className={`connection-state ${running?'connected':''}`}>{running?(state==='paused'?'Пауза':time):state==='pairing'?'Подключение':state==='opening'||state==='connecting'?'Подключение…':'Не подключено'}</span>
      <div className="header-actions">{modePicker}<button className="plain-icon" aria-label="Настройки" onClick={()=>setPanel(true)}><Settings2 size={21}/></button></div>
    </header>
    <section className="viewfinder" ref={surface}>
      <video ref={video} autoPlay playsInline muted className={phone?'phone-video':'source-video'}/>
      {!phone&&<canvas ref={canvas} className={`output-canvas ${running?'visible':''}`}/>}
      {running&&<><span className="live-pill sr-only">{state==='paused'?'ПАУЗА':'LIVE'}</span>{grid&&<div className="grid-overlay"/>}
        {!phone&&<div className="frame-actions"><button className="glass-icon" aria-label="Повернуть изображение на 90 градусов" onClick={()=>{setAutoRotate(false);setRotation(r=>(r+90)%360)}}><RotateCw size={20}/></button><button className={`glass-icon ${mirror?'selected':''}`} aria-label="Отразить изображение" aria-pressed={mirror} onClick={()=>setMirror(!mirror)}><FlipHorizontal size={20}/></button><button className="glass-icon" aria-label="Полный экран" onClick={fullscreen}><Maximize size={19}/></button></div>}
        {!phone&&<div className="lens-strip">{info.devices.filter(d=>!/front|user|перед|фронт/i.test(d.label)).slice(0,4).map((d,index)=><button key={d.id} className={`lens-button ${settings.deviceId===d.id?'active':''}`} disabled={busy} onClick={()=>command('device',d.id)} title={d.label}>{/ultra|сверх/i.test(d.label)?'Широкий':/tele|теле/i.test(d.label)?'Теле':/back|rear|задн/i.test(d.label)?'Основной':`Камера ${index+1}`}</button>)}<button className="zoom-button" onClick={()=>setPanel(true)} title={caps.zoom?'Зум камеры':'Цифровой зум'}>{(caps.zoom?zoom:crop).toFixed(1).replace('.0','')}<small>×</small></button></div>}
      </>}
      {!running&&<div className="connect-screen">
        {qr?<><div className="qr-frame"><img src={qr} width={228} height={228} alt="QR-код подключения"/></div><p className="connect-label">Отсканируй на iPhone</p><button className="text-button" onClick={copy}>{copied?<Check size={16}/>:<Link2 size={16}/>} {copied?'Скопировано':'Ссылка'}</button></>:
        state==='opening'||state==='connecting'?<><LoaderCircle className="spin" size={28}/><p className="connect-label">{note||'Подключение…'}</p></>:
        <><span className="connect-icon">{phone?<Camera size={36} strokeWidth={1.4}/>:<ScanLine size={42} strokeWidth={1.3}/>}</span><button className="primary-button" disabled={!ready} onClick={connect}>{phone?'Открыть камеру':'Подключить телефон'}</button></>}
      </div>}
      {(error||note&&running)&&<div className={`message ${error?'error':''}`} role={error?'alert':'status'}>{error||note}<button aria-label="Закрыть сообщение" onClick={()=>{setError('');setNote('')}}><X size={16}/></button></div>}
    </section>
    <nav className="camera-toolbar" aria-label="Управление камерой">
      <div className="toolbar-left"><button className={`round-button ${grid?'selected':''}`} aria-label="Сетка кадра" aria-pressed={grid} onClick={()=>setGrid(!grid)}><Grid3X3 size={21}/></button>{state!=='idle'&&<button className="round-button disconnect" aria-label="Отключить телефон" onClick={()=>session.current?.stop()}><X size={22}/></button>}</div>
      <button className={`shutter ${running?'recording':''} ${state==='paused'?'paused':''}`} aria-label={running?(state==='paused'?'Продолжить камеру':'Приостановить камеру'):'Подключить камеру'} disabled={busy||['opening','connecting','pairing'].includes(state)} onClick={()=>running?command('pause',state!=='paused'):connect()}><span>{running?(state==='paused'?<Play size={24} fill="currentColor"/>:<Pause size={24} fill="currentColor"/>):null}</span></button>
      <div className="toolbar-right"><button className="round-button" aria-label="Переключить переднюю и заднюю камеру" disabled={controlsDisabled} onClick={()=>command('flip',null)}><SwitchCamera size={27}/></button></div>
    </nav>
    <Sheet open={panel} onOpenChange={setPanel}><SheetContent className="settings-panel" showCloseButton={false}>
      <SheetHeader className="settings-heading"><SheetTitle>Настройки</SheetTitle><SheetDescription className="sr-only">Камера, качество и параметры изображения</SheetDescription><button className="plain-icon" aria-label="Закрыть настройки" onClick={()=>setPanel(false)}><X size={21}/></button></SheetHeader>
      <div className="settings-body">
        {info.devices.length>0&&<div className="setting-block"><label>Камера</label><Select value={settings.deviceId} onValueChange={v=>command('device',v)} disabled={busy}><SelectTrigger className="camera-select"><SelectValue/></SelectTrigger><SelectContent>{info.devices.map(d=><SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}</SelectContent></Select></div>}
        <div className="setting-block"><div className="setting-label"><label>{caps.zoom?'Зум':'Цифровой зум'}</label><span>{(caps.zoom?zoom:crop).toFixed(1)}×</span></div><Slider aria-label={caps.zoom?'Зум камеры':'Цифровой зум'} min={caps.zoom?.min||1} max={caps.zoom?.max||4} step={caps.zoom?.step||0.1} value={[caps.zoom?zoom:crop]} disabled={controlsDisabled} onValueChange={v=>caps.zoom?setZoom(v[0]):setCrop(v[0])} onValueCommit={v=>{if(caps.zoom)command('constraint',v[0],'zoom')}}/></div>
        {info.modes.length>0&&<div className="setting-block"><label>Качество</label><Select value={currentMode==='-1'?undefined:currentMode} onValueChange={v=>command('mode',v)} disabled={busy}><SelectTrigger className="camera-select"><SelectValue placeholder="Авто"/></SelectTrigger><SelectContent>{info.modes.map(i=><SelectItem key={i} value={i}>{MODES[Number(i)][0]} FPS</SelectItem>)}</SelectContent></Select></div>}
        <div className="setting-block"><label className="toggle-row"><span>Автоповорот</span><Switch checked={autoRotate} onCheckedChange={setAutoRotate} aria-label="Автоповорот"/></label><label className="toggle-row"><span>Зеркально</span><Switch checked={mirror} onCheckedChange={setMirror} disabled={!running||phone} aria-label="Зеркальное отражение"/></label><label className="toggle-row"><span>Сетка</span><Switch checked={grid} onCheckedChange={setGrid} aria-label="Сетка"/></label></div>
        {['focusMode','exposureMode','whiteBalanceMode'].map((key,index)=>Array.isArray(caps[key])&&caps[key].length>1?<div className="setting-block" key={key}><label>{['Фокус','Экспозиция','Баланс белого'][index]}</label><Select value={settings[key]} onValueChange={v=>command('constraint',v,key)} disabled={busy}><SelectTrigger className="camera-select"><SelectValue/></SelectTrigger><SelectContent>{caps[key].map((v:string)=><SelectItem key={v} value={v}>{PRESETS[v]||v}</SelectItem>)}</SelectContent></Select></div>:null)}
        {['exposureCompensation','focusDistance','colorTemperature'].map(key=>caps[key]&&caps[key].max>caps[key].min?<div className="setting-block" key={key}><div className="setting-label"><label>{key==='exposureCompensation'?'Экспокоррекция':key==='focusDistance'?'Фокусное расстояние':'Температура'}</label><span>{settings[key]}</span></div><Slider aria-label={key} min={caps[key].min} max={caps[key].max} step={caps[key].step||0.1} defaultValue={[settings[key]??caps[key].min]} disabled={busy} onValueCommit={v=>command('constraint',v[0],key)}/></div>:null)}
        {caps.torch&&<label className="toggle-row"><span>Фонарик</span><Switch checked={!!settings.torch} onCheckedChange={v=>command('constraint',v,'torch')} disabled={busy} aria-label="Фонарик"/></label>}
        {running&&<dl className="stream-details"><div><dt>Поток</dt><dd>{video.current?.videoWidth} × {video.current?.videoHeight}</dd></div><div><dt>Частота</dt><dd>{stats.fps} FPS</dd></div><div><dt>Сеть</dt><dd>{stats.mbps.toFixed(1)} Мбит/с</dd></div>{native&&<div><dt>Выход</dt><dd>{outputFrames} FPS</dd></div>}</dl>}
        {native?<p className="native-status">{nativeState.error||(nativeState.installed?(nativeState.consumer?'VCam используется':'Выбери VCam в приложении для звонков'):'Установи VCam Setup для активации камеры')}</p>:!phone&&<a className="download-link" href={DOWNLOAD} target="_blank" rel="noreferrer"><Download size={17}/>Скачать для Windows</a>}
      </div>
    </SheetContent></Sheet>
  </main>;
}
