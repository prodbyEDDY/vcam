export type CameraInfo = { settings: MediaTrackSettings; capabilities: MediaTrackCapabilities & Record<string, any>; devices: {id:string;label:string}[]; modes: string[] };
export const MODES = [ ['720p · 30',1280,720,30], ['1080p · 30',1920,1080,30], ['1080p · 60',1920,1080,60], ['4K · 30',3840,2160,30], ['4K · 60',3840,2160,60] ] as const;
export async function inspectCamera(track:MediaStreamTrack):Promise<CameraInfo> {
  const settings = track.getSettings(), capabilities = track.getCapabilities?.() || {};
  const devices = (await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput').map((d,i)=>({id:d.deviceId,label:d.label || `Камера ${i+1}`}));
  return {settings,capabilities,devices,modes:[]};
}
export async function setMode(track:MediaStreamTrack, index:number) {
  const mode = MODES[index]; if(!mode) throw new Error('Неизвестный режим');
  const [,width,height,frameRate] = mode;
  const previous=track.getConstraints();
  try {
    await track.applyConstraints({...previous,width:{exact:width},height:{exact:height},frameRate:{exact:frameRate}});
    const s=track.getSettings();
    if (Math.max(s.width||0,s.height||0)!==width || Math.min(s.width||0,s.height||0)!==height || Math.abs((s.frameRate||0)-frameRate)>1) throw new Error('Браузер не подтвердил выбранный режим.');
    return s;
  } catch(e) { await track.applyConstraints(previous).catch(()=>{}); throw e; }
}
export async function gather(peer:RTCPeerConnection) {
  if(peer.iceGatheringState==='complete') return;
  await new Promise<void>((resolve)=>{
    const done=()=>{clearTimeout(timer);peer.removeEventListener('icegatheringstatechange',check);resolve()};
    const check=()=>{if(peer.iceGatheringState==='complete') done()};
    const timer=setTimeout(done,8000);peer.addEventListener('icegatheringstatechange',check);
  });
}
export const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));
export async function probeModes(track:MediaStreamTrack) {
  const modes:string[]=[]; const original=track.getConstraints();
  for(let i=0;i<MODES.length;i++) {
    if(track.readyState!=='live') break;
    try {await setMode(track,i);modes.push(String(i));} catch { /* Unsupported combinations stay hidden. */ }
  }
  await track.applyConstraints(original).catch(()=>{});
  if(modes.includes('1')) await setMode(track,1).catch(()=>{});
  return modes;
}
