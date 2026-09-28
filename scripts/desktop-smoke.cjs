const checkCameraUI=require('./check-camera-ui.cjs');
const {app,BrowserWindow,session}=require('electron');const {spawn}=require('node:child_process');const path=require('node:path');const fs=require('node:fs');
process.env.VCAM_TEST_SITE=process.env.VCAM_QA_SITE||'http://127.0.0.1:5173';process.env.VCAM_SMOKE_TEST='1';
app.setPath('userData',path.join(__dirname,'../.cache/test-profiles/desktop-smoke'));
app.commandLine.appendSwitch('use-fake-device-for-media-stream','fps=60');app.commandLine.appendSwitch('use-fake-ui-for-media-stream');app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
require('../desktop/main.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const wait=async(fn,label,timeout=60000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await fn())return;await delay(500)}throw new Error('Timeout: '+label)};
app.whenReady().then(async()=>{
 let host,phone;
 try{
  await wait(async()=>!!BrowserWindow.getAllWindows().length,'desktop window');host=BrowserWindow.getAllWindows()[0];
  await wait(()=>host.webContents.executeJavaScript(`!!document.querySelector('.primary-button')&&!document.querySelector('.primary-button').disabled`),'packaged UI');
  await checkCameraUI(host);
  fs.writeFileSync(path.join(__dirname,'../.cache/qa/windows-idle.png'),(await host.webContents.capturePage()).toPNG());
  await host.webContents.executeJavaScript(`navigator.clipboard.writeText=async(t)=>{window.testLink=t};document.querySelector('.primary-button').click()`);
  await wait(()=>host.webContents.executeJavaScript(`!!document.querySelector('.qr-frame img')`),'desktop QR');
  await host.webContents.executeJavaScript(`document.querySelector('.text-button').click()`);const link=await host.webContents.executeJavaScript('window.testLink');
  const phoneSession=session.fromPartition('vcam-phone-test');phoneSession.setPermissionRequestHandler((_w,p,cb)=>cb(p==='media'));
  phone=new BrowserWindow({show:false,width:430,height:932,webPreferences:{session:phoneSession,backgroundThrottling:false}});await phone.loadURL(link);
  // A QR navigation must start the camera automatically; no extra shutter click.
  await wait(()=>phone.webContents.executeJavaScript(`!!document.querySelector('video')?.srcObject`),'automatic phone camera');
  await wait(()=>host.webContents.executeJavaScript(`document.querySelector('.live-pill')?.textContent.includes('LIVE')`),'desktop video');
  await checkCameraUI(host,{live:true});
  await host.webContents.insertCSS('.quick-quality-menu{animation:none!important;transition:none!important}');
  // The quick picker must open visibly and apply the same remote command as Settings.
  async function quickMode(index,width){
   await wait(()=>host.webContents.executeJavaScript(`!!document.querySelector('.quality-select')&&!document.querySelector('.quality-select').disabled`),'quality modes ready',5000);
   await host.webContents.executeJavaScript(`document.querySelector('.quality-select').focus()`);
   host.webContents.sendInputEvent({type:'keyDown',keyCode:'Space'});host.webContents.sendInputEvent({type:'keyUp',keyCode:'Space'});
   await wait(()=>host.webContents.executeJavaScript(`!!document.querySelector('[role="listbox"]')`),'quick quality menu',5000);
   const menu=await host.webContents.executeJavaScript(`(()=>{const e=document.querySelector('[role="listbox"]'),r=e.getBoundingClientRect();return {width:r.width,height:r.height,top:r.top,opacity:getComputedStyle(e).opacity}})()`);
   if(menu.width<100||menu.height<30||menu.top<0||menu.opacity==='0')throw Error('Quick quality menu is invisible: '+JSON.stringify(menu));
   await host.webContents.executeJavaScript(`document.querySelectorAll('[role="option"]')[${index}].focus()`);
   host.webContents.sendInputEvent({type:'keyDown',keyCode:'Return'});host.webContents.sendInputEvent({type:'keyUp',keyCode:'Return'});
   await wait(()=>phone.webContents.executeJavaScript(`document.querySelector('video').srcObject?.getVideoTracks()[0]?.getSettings().width===${width}`),'remote quality change');
   await wait(()=>host.webContents.executeJavaScript(`!document.querySelector('.quality-select').disabled`),'quality applied');
  }
  await quickMode(0,1280);await quickMode(1,1920);console.log('Quick quality picker: visible, 720p and 1080p applied on phone PASS');
  host.minimize();await wait(async()=>host.isMinimized(),'minimized window');
  const result=await new Promise((resolve,reject)=>{const p=spawn(path.join(__dirname,'../.cache/VCamProbe.exe'),[path.join(__dirname,'../native/bin/VCamCamera64.dll'),'--motion'],{windowsHide:true});let output='';p.stdout.on('data',c=>output+=c);p.on('error',reject);p.on('exit',code=>code===0?resolve(output):reject(new Error(output||'Native probe failed')))});

  console.log(result);host.restore();host.hide();
  await host.webContents.executeJavaScript(`document.querySelector('.disconnect').click()`);
  await wait(()=>phone.webContents.executeJavaScript(`document.querySelector('video').srcObject===null`),'phone release before rescan');
  await host.webContents.executeJavaScript(`document.querySelector('.primary-button').click()`);
  await wait(()=>host.webContents.executeJavaScript(`!!document.querySelector('.qr-frame img')`),'new QR');
  await host.webContents.executeJavaScript(`document.querySelector('.text-button').click()`);
  const secondLink=await host.webContents.executeJavaScript('window.testLink');
  await phone.webContents.executeJavaScript('location.hash='+JSON.stringify(new URL(secondLink).hash));
  await wait(()=>host.webContents.executeJavaScript(`document.querySelector('.live-pill')?.textContent.includes('LIVE')`),'automatic rescan in same tab');
  await host.webContents.executeJavaScript(`document.querySelector('.disconnect').click()`);
  await wait(()=>phone.webContents.executeJavaScript(`document.querySelector('video').srcObject===null`),'phone release before code');
  await host.webContents.executeJavaScript(`document.querySelector('.primary-button').click()`);
  await wait(()=>host.webContents.executeJavaScript(`!!document.querySelector('[data-testid="pair-code"]')`),'manual pairing code');
  const code=await host.webContents.executeJavaScript(`document.querySelector('[data-testid="pair-code"]').textContent`);
  await phone.loadURL(new URL('/connect',secondLink).href);
  await wait(()=>phone.webContents.executeJavaScript(`!!document.querySelector('main[data-ready="true"] #connection-code')`),'manual connection page');
  await phone.webContents.executeJavaScript(`document.querySelector('#connection-code').focus()`);await phone.webContents.insertText(code);
  await wait(()=>phone.webContents.executeJavaScript(`!document.querySelector('.code-form button').disabled`),'code input ready');
  await phone.webContents.executeJavaScript(`document.querySelector('.code-form').requestSubmit()`);
  await wait(()=>host.webContents.executeJavaScript(`document.querySelector('.live-pill')?.textContent.includes('LIVE')`),'manual code connection');
  console.log('Automatic QR, same-tab rescan, manual code, minimized moving video: PASS');
  const state=await host.webContents.executeJavaScript('window.vcam.status()');
  const dimensions=await host.webContents.executeJavaScript(`({width:document.querySelector('video').videoWidth,height:document.querySelector('video').videoHeight})`);
  fs.writeFileSync(path.join(__dirname,'../.cache/qa/windows-live.png'),(await host.webContents.capturePage()).toPNG());
  console.log(JSON.stringify({result:'PASS',native:result,status:state,dimensions}));await host.webContents.executeJavaScript(`document.querySelector('.disconnect').click()`);phone.destroy();host.destroy();app.quit();
 }catch(e){console.error(e.message);if(host)console.error('Desktop:',await host.webContents.executeJavaScript(`({message:document.querySelector('.message')?.textContent,quality:document.querySelector('.quality-select')?.outerHTML,buttons:[...document.querySelectorAll('.camera-select')].map(e=>e.textContent)})`));if(phone)console.error('Phone:',await phone.webContents.executeJavaScript(`document.querySelector('.message')?.textContent`));phone?.destroy();host?.destroy();app.exit(1)}
});
