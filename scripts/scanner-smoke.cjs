const {app,BrowserWindow}=require('electron');const path=require('node:path');const QRCode=require('../web/node_modules/qrcode');
const base=process.env.VCAM_QA_SITE||'http://localhost:5173';
app.setPath('userData',path.join(__dirname,'../.cache/test-profiles/scanner-smoke'));
app.commandLine.appendSwitch('use-fake-device-for-media-stream');app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
const wait=async fn=>{for(let i=0;i<100;i++){if(await fn())return;await new Promise(r=>setTimeout(r,200))}throw Error('Scanner did not consume QR')};
app.whenReady().then(async()=>{let room,w;try{
 room=await fetch(base+'/api/session',{method:'POST',body:'{}'}).then(r=>r.json());if(!room.id)throw Error('Test room failed');
 const img=await QRCode.toDataURL(`${base}/connect#room=${room.id}&key=${room.pairToken}`,{width:640,margin:4});
 w=new BrowserWindow({show:false,width:430,height:932,webPreferences:{preload:path.join(__dirname,'scanner-preload.cjs'),contextIsolation:false,sandbox:false,backgroundThrottling:false,additionalArguments:['--scanner-image='+img]}});
 await w.loadURL(base+'/connect');
 await wait(()=>w.webContents.executeJavaScript(`window.scannerTestTrack?.readyState==='ended'&&!!document.querySelector('.phone-video')?.srcObject`));
 const reused=await fetch(base+'/api/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:room.code})});
 if(reused.status!==410)throw Error('Scanner did not consume the paired session');
 console.log('Scanner PASS: real QR pixels decoded, session joined, scanner track stopped, streaming camera started');
}catch(e){console.error(e);process.exitCode=1}finally{w?.destroy();if(room?.hostToken)await fetch(base+'/api/signal?id='+room.id+'&role=host',{method:'DELETE',headers:{Authorization:'Bearer '+room.hostToken}});app.exit(process.exitCode||0)}});
