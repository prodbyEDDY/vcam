const checkCameraUI=require('./check-camera-ui.cjs');
// Real Chromium/WebRTC smoke test with a synthetic camera; not an iPhone compatibility claim.
const {app,BrowserWindow}=require('electron');const fs=require('node:fs');const path=require('node:path');
app.commandLine.appendSwitch('use-fake-device-for-media-stream');app.commandLine.appendSwitch('use-fake-ui-for-media-stream');app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const wait=async(fn,label,timeout=90000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await fn())return;await delay(500)}throw new Error('Timeout: '+label)};
app.whenReady().then(async()=>{
 let host,phone;
 try{
  host=new BrowserWindow({show:false,width:1380,height:1000,webPreferences:{backgroundThrottling:false}});
  host.webContents.on('console-message',(_e,_l,msg)=>{if(msg.includes('Error'))console.log(msg)});
  await host.loadURL(process.env.VCAM_QA_SITE||'http://127.0.0.1:5173/');await wait(()=>host.webContents.executeJavaScript(`!document.querySelector('.primary-button')?.disabled`),'hydration');
  await checkCameraUI(host);
  fs.mkdirSync(path.join(__dirname,'../.cache/qa'),{recursive:true});await delay(1000);fs.writeFileSync(path.join(__dirname,'../.cache/qa/desktop.png'),(await host.webContents.capturePage()).toPNG());
  await host.webContents.executeJavaScript(`navigator.clipboard.writeText=async(text)=>{window.testPairLink=text};document.querySelector('.primary-button').click()`);
  await wait(()=>host.webContents.executeJavaScript(`!!document.querySelector('.qr-frame img')`),'QR');
  await host.webContents.executeJavaScript(`document.querySelector('.text-button').click()`);const link=await host.webContents.executeJavaScript(`window.testPairLink`);
  if(!link?.includes('#room='))throw new Error('Missing pairing URL');
  phone=new BrowserWindow({show:false,width:430,height:932,webPreferences:{backgroundThrottling:false}});await phone.loadURL(link);
  await wait(()=>phone.webContents.executeJavaScript(`!document.querySelector('.primary-button')?.disabled`),'phone hydration');await delay(500);
  await checkCameraUI(phone,{phone:true});
  fs.writeFileSync(path.join(__dirname,'../.cache/qa/phone.png'),(await phone.webContents.capturePage()).toPNG());
  await phone.webContents.executeJavaScript(`document.querySelector('.primary-button').click()`);
  await wait(()=>host.webContents.executeJavaScript(`document.querySelector('.live-pill')?.textContent.includes('LIVE')`),'WebRTC live');
  await wait(()=>host.webContents.executeJavaScript(`document.querySelector('canvas')?.width>1`),'decoded video');
  await checkCameraUI(host,{live:true});
  const dimensions=await host.webContents.executeJavaScript(`({width:document.querySelector('video').videoWidth,height:document.querySelector('video').videoHeight})`);
  await host.webContents.executeJavaScript(`document.querySelector('[aria-label="Отразить изображение"]').click();document.querySelector('[aria-label="Повернуть изображение на 90 градусов"]').click()`);await delay(500);
  fs.writeFileSync(path.join(__dirname,'../.cache/qa/live.png'),(await host.webContents.capturePage()).toPNG());
  await host.webContents.executeJavaScript(`document.querySelector('.shutter').click()`);
  await wait(()=>phone.webContents.executeJavaScript(`document.querySelector('video').srcObject.getVideoTracks()[0].enabled===false`),'remote pause');
  await host.webContents.executeJavaScript(`document.querySelector('.shutter').click()`);
  await wait(()=>phone.webContents.executeJavaScript(`document.querySelector('video').srcObject.getVideoTracks()[0].enabled===true`),'remote resume');
  await host.webContents.executeJavaScript(`document.querySelector('.disconnect').click()`);
  await wait(()=>phone.webContents.executeJavaScript(`document.querySelector('video').srcObject===null`),'camera release');
  console.log(JSON.stringify({result:'PASS',checks:['pairing QR','WebRTC frames','rotation and mirror','remote pause/resume','camera shutdown'],dimensions}));
  host.destroy();phone.destroy();app.exit(0);
 }catch(e){console.error(e.message);if(host)console.error('Host:',await host.webContents.executeJavaScript(`document.querySelector('.message')?.textContent`));if(phone)console.error('Phone:',await phone.webContents.executeJavaScript(`document.querySelector('.message')?.textContent`));host?.destroy();phone?.destroy();app.exit(1)}
});
