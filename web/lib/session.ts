import { CameraInfo, gather, inspectCamera, probeModes, setMode, sleep } from './camera';
export type SessionState = 'idle'|'opening'|'pairing'|'connecting'|'live'|'paused'|'error';
export type Room={id:string;hostToken?:string;phoneToken?:string;pairToken?:string;code?:string;expires?:number};
export const EMPTY_INFO:CameraInfo={settings:{},capabilities:{},devices:[],modes:[]};
declare global { interface Window { vcam?: {site:string;version:string;locale?:'ru'|'en';setLocale?:(locale:'ru'|'en')=>Promise<void>;api:(path:string,options:any)=>Promise<any>;frame:(w:number,h:number,data:ArrayBuffer)=>Promise<boolean>;status:()=>Promise<{installed:boolean;consumer:boolean;error?:string;update?:string}>} } }
export const friendly=(e:any)=>e?.name==='NotAllowedError'?'Разреши доступ к камере в настройках Safari.':e?.name==='OverconstrainedError'?'Этот режим недоступен для выбранной камеры.':e?.name==='NotReadableError'?'Камера занята другим приложением.':e?.message||'Не удалось подключиться. Попробуй ещё раз.';
type Events={state:(s:SessionState)=>void;note:(s:string)=>void;error:(s:string)=>void;info:(i:CameraInfo)=>void;link:(s:string)=>void;code?:(s:string)=>void;stream:(s:MediaStream|null)=>void;busy:(b:boolean)=>void;orientation:(a:number)=>void};
export class CameraSession {
  peer:RTCPeerConnection|null=null; channel:RTCDataChannel|null=null; stream:MediaStream|null=null;
  room:Room|null=null;pair:{id:string;token:string}|{code:string}|null=null; epoch=0;info=EMPTY_INFO;phone=false;locale:'ru'|'en'='ru';wake:any=null;
  private queue=Promise.resolve(); private pending=new Map<string,{resolve:()=>void;reject:(e:any)=>void;timer:any}>();
  constructor(private events:Events){}
  async api(path:string,options:any={}) {
    if(window.vcam)return window.vcam.api(path,options);
    const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(15000)});
    const body:any=await r.json().catch(()=>({error:'Сервис подключения недоступен.'}));if(!r.ok)throw new Error(body.error||'Ошибка подключения');return body;
  }
  private path(r:Room,role:string){return `/api/signal?id=${encodeURIComponent(r.id)}&role=${role}`}
  private auth(r:Room,role:string){return {Authorization:`Bearer ${role==='host'?r.hostToken:r.phoneToken}`}}
  send(data:any){if(this.channel?.readyState==='open')this.channel.send(JSON.stringify(data))}
  async wakeScreen(){try{if('wakeLock'in navigator&&document.visibilityState==='visible')this.wake=await (navigator as any).wakeLock.request('screen')}catch{}}
  setInfo(info:CameraInfo){this.info=info;this.events.info(info)}
  stop(notify=true){
    this.epoch++;if(notify)this.send({type:'stop'});
    for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(new Error('Соединение закрыто.'))}this.pending.clear();
    this.channel?.close();this.channel=null;this.peer?.close();this.peer=null;
    this.stream?.getTracks().forEach(t=>{t.onended=null;t.stop()});this.stream=null;this.events.stream(null);
    this.wake?.release().catch(()=>{});this.wake=null;
    const r=this.room;this.room=null;if(r?.hostToken)void this.api(this.path(r,'host'),{method:'DELETE',headers:this.auth(r,'host')}).catch(()=>{});
    this.events.link('');this.events.code?.('');this.events.state('idle');this.events.busy(false);this.events.note('');this.setInfo(EMPTY_INFO);
  }
  private fail(e:any){this.stop(false);this.events.error(friendly(e));this.events.state('error')}
  private makePeer(epoch:number){
    const p=new RTCPeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'}]});this.peer=p;
    p.onconnectionstatechange=()=>{
      if(this.epoch!==epoch)return;
      if(p.connectionState==='connected'){this.events.state('live');this.events.note('');void this.wakeScreen()}
      if(p.connectionState==='disconnected')this.events.note('Связь прервалась. Пытаемся восстановить…');
      if(p.connectionState==='failed')this.fail(new Error('Нет прямого соединения. Подключи устройства к одной сети Wi-Fi без гостевой изоляции и VPN.'));
    };return p;
  }
  private attachChannel(c:RTCDataChannel){
    this.channel=c;c.onopen=()=>{if(this.phone){this.send({type:'info',info:this.info});this.send({type:'orientation',angle:screen.orientation?.angle??0})}};
    c.onmessage=e=>{
      let d:any;try{d=JSON.parse(e.data)}catch{return}
      if(d.type==='stop'){this.stop(false);this.events.note('Соединение завершено');return}
      if(d.type==='info'&&!this.phone){this.setInfo(d.info);return}
      if(d.type==='orientation'&&!this.phone){this.events.orientation(d.angle);return}
      if(d.type==='visibility'&&!this.phone){this.events.note(d.hidden?'Верни Safari на экран телефона, чтобы продолжить съёмку.':'');return}
      if(d.type==='muted'&&!this.phone){this.events.state(d.muted?'paused':'live');this.events.note(d.muted?'Камера приостановлена на телефоне.':'');return}
      if(d.type==='ack'){const p=this.pending.get(d.id);if(p){clearTimeout(p.timer);this.pending.delete(d.id);d.error?p.reject(new Error(d.error)):p.resolve()}return}
      if(d.type==='command'&&this.phone)this.queue=this.queue.then(async()=>{try{await this.apply(d);this.send({type:'ack',id:d.id})}catch(e){this.events.busy(false);this.send({type:'ack',id:d.id,error:friendly(e)});this.events.error(friendly(e))}});
    };
  }
  private async poll(p:RTCPeerConnection,r:Room,role:string,epoch:number){
    const deadline=Math.min(r.expires||Infinity,Date.now()+600000);
    while(this.epoch===epoch&&Date.now()<deadline){
      const {messages}=await this.api(this.path(r,role),{headers:this.auth(r,role)});
      if(this.epoch!==epoch)return false;
      if(messages.length){await p.setRemoteDescription(messages[0]);return true}await sleep(role==='host'?2500:800);
    }
    if(this.epoch===epoch)throw new Error('Время ожидания истекло. Создай новый QR.');return false;
  }
  private timeout(p:RTCPeerConnection,epoch:number){setTimeout(()=>{if(this.epoch===epoch&&p.connectionState!=='connected')this.fail(new Error('Не удалось передать видео. Проверь Wi-Fi и создай новый QR-код.'))},30000)}
  async host(){
    if(!window.vcam){this.events.error('Создай подключение в приложении VCam для Windows.');return}
    this.stop();this.phone=false;this.events.error('');this.events.state('opening');this.events.note('Готовим подключение…');const epoch=this.epoch;
    try{
      const r:Room=await this.api('/api/session',{method:'POST',body:'{}'});if(this.epoch!==epoch)return;this.room=r;
      const p=this.makePeer(epoch);p.addTransceiver('video',{direction:'recvonly'});this.attachChannel(p.createDataChannel('camera'));
      p.ontrack=e=>{if(this.epoch===epoch){this.stream=e.streams[0]||new MediaStream([e.track]);this.events.stream(this.stream)}};
      await p.setLocalDescription(await p.createOffer());await gather(p);if(this.epoch!==epoch)return;
      await this.api(this.path(r,'host'),{method:'POST',headers:this.auth(r,'host'),body:JSON.stringify(p.localDescription)});
      this.events.link(`${window.vcam.site}${this.locale==='en'?'/en/connect':'/connect'}#room=${r.id}&key=${r.pairToken}`);this.events.code?.(r.code||'');this.events.state('pairing');this.events.note('');
      if(await this.poll(p,r,'host',epoch)){this.events.link('');this.events.code?.('');this.events.state('connecting');this.events.note('Подключаем видеопоток…');this.timeout(p,epoch)}
    }catch(e){if(this.epoch===epoch)this.fail(e)}
  }
  private bind(track:MediaStreamTrack){
    track.onmute=()=>{this.send({type:'muted',muted:true});this.events.note('Камера приостановлена системой.')};
    track.onunmute=()=>{this.send({type:'muted',muted:!track.enabled});this.events.note('')};
    track.onended=()=>{this.send({type:'muted',muted:true});this.events.error('Доступ к камере завершён. Подключись заново.')};
  }
  private async scan(track:MediaStreamTrack){
    this.events.busy(true);this.events.note('Проверяем доступные режимы камеры…');
    const modes=await probeModes(track);const info={...await inspectCamera(track),modes};this.setInfo(info);this.send({type:'info',info});this.events.busy(false);this.events.note('');
  }
  private async tuneSender(){
    const sender=this.peer?.getSenders().find(s=>s.track?.kind==='video');if(!sender?.track)return;
    try{const s=sender.track.getSettings(),p=sender.getParameters();if(!p.encodings?.length)return;
      p.encodings[0].maxBitrate=Math.min(50000000,Math.max(2000000,(s.width||1280)*(s.height||720)*(s.frameRate||30)*0.14));
      p.encodings[0].maxFramerate=s.frameRate||30;p.degradationPreference='maintain-resolution';await sender.setParameters(p);
    }catch{/* Safari may not expose encoder controls; negotiated defaults remain valid. */}
  }
  async connectPhone(){
    if(!this.pair){this.events.error('Открой VCam на компьютере и отсканируй новый QR-код.');return}
    const pair=this.pair;
    this.stop();this.phone=true;this.events.error('');this.events.state('opening');this.events.note('Открываем камеру…');const epoch=this.epoch;
    const D=(window as any).DeviceOrientationEvent;if(D?.requestPermission)void D.requestPermission().catch(()=>{});
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Для камеры нужен Safari и защищённая HTTPS-ссылка.');
      const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080},frameRate:{ideal:30}},audio:false});
      if(this.epoch!==epoch){media.getTracks().forEach(t=>t.stop());return}this.stream=media;this.events.stream(media);void this.wakeScreen();
      const joined=await this.api('/api/join',{method:'POST',body:JSON.stringify(pair)});if(this.epoch!==epoch)return;const r:Room={id:joined.id||('id'in pair?pair.id:''),phoneToken:joined.phoneToken};this.room=r;this.pair=null;
      await this.scan(media.getVideoTracks()[0]);if(this.epoch!==epoch)return;this.bind(media.getVideoTracks()[0]);
      const p=this.makePeer(epoch);p.ondatachannel=e=>this.attachChannel(e.channel);media.getTracks().forEach(t=>p.addTrack(t,media));
      this.events.state('connecting');this.events.note('Соединяемся с компьютером…');
      if(!await this.poll(p,r,'phone',epoch))return;
      await p.setLocalDescription(await p.createAnswer());await gather(p);if(this.epoch!==epoch)return;
      await this.api(this.path(r,'phone'),{method:'POST',headers:this.auth(r,'phone'),body:JSON.stringify(p.localDescription)});await this.tuneSender();this.timeout(p,epoch);
    }catch(e){if(this.epoch===epoch)this.fail(e)}
  }
  private async apply(c:any){
    const track=this.stream?.getVideoTracks()[0];if(!track)throw new Error('Камера не подключена.');
    if(c.name==='device'||c.name==='flip'){
      this.events.busy(true);this.events.note('Переключаем камеру…');const previous=track.getSettings();track.onended=null;track.stop();
      let media:MediaStream;let failure:any;
      try{media=await navigator.mediaDevices.getUserMedia({audio:false,video:c.name==='device'?{deviceId:{exact:c.value},width:{ideal:1920},height:{ideal:1080}}:{facingMode:{exact:previous.facingMode==='user'?'environment':'user'},width:{ideal:1920},height:{ideal:1080}}})}
      catch(e){failure=e;media=await navigator.mediaDevices.getUserMedia({audio:false,video:{deviceId:{exact:previous.deviceId}}})}
      this.stream=media;const next=media.getVideoTracks()[0];this.events.stream(media);await this.peer?.getSenders().find(s=>s.track?.kind==='video')?.replaceTrack(next);this.bind(next);await this.scan(next);await this.tuneSender();if(failure)throw failure;return;
    }
    if(c.name==='mode'){await setMode(track,Number(c.value));await this.tuneSender()}
    else if(c.name==='pause'){track.enabled=!c.value;this.events.state(c.value?'paused':'live');this.send({type:'muted',muted:!!c.value});return}
    else if(c.name==='constraint'){
      const allowed=['zoom','torch','exposureCompensation','focusDistance','focusMode','exposureMode','whiteBalanceMode','colorTemperature'];
      if(!allowed.includes(c.key)||!(c.key in (track.getCapabilities?.()||{})))throw new Error('Настройка недоступна.');
      await track.applyConstraints({advanced:[{[c.key]:c.value}] as MediaTrackConstraintSet[]});
    }
    const info={...await inspectCamera(track),modes:this.info.modes};this.setInfo(info);this.send({type:'info',info});
  }
  async command(name:string,value:any,key?:string){
    this.events.error('');this.events.busy(true);
    try{if(this.phone)await this.apply({name,value,key});else{
      if(this.channel?.readyState!=='open')throw new Error('Телефон ещё не подключён.');const id=crypto.randomUUID();
      await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error('Телефон не ответил. Проверь, что Safari открыт.'))},60000);this.pending.set(id,{resolve,reject,timer});this.send({type:'command',id,name,value,key})});
    }}catch(e){this.events.error(friendly(e))}finally{this.events.busy(false)}
  }
}
