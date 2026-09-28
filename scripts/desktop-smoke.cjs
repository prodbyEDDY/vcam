const checkCameraUI=require('./check-camera-ui.cjs');
const {app,BrowserWindow,session}=require('electron');const {spawn}=require('node:child_process');const path=require('node:path');const fs=require('node:fs');
process.env.VCAM_TEST_SITE=process.env.VCAM_QA_SITE||'http://127.0.0.1:5173';process.env.VCAM_SMOKE_TEST='1';
app.commandLine.appendSwitch('use-fake-device-for-media-stream');app.commandLine.appendSwitch('use-fake-ui-for-media-stream');app.commandLine.appendSwitch('autoplay-policy','no-user-gesture-required');
require('../desktop/main.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const wait=async(fn,label,timeout=60000)=>{const start=Date.now();while(Date.now()-start<timeout){if(await fn())return;await delay(500)}throw new Error('Timeout: '+label)};
app.whenReady().then(async()=>{
 let host,phone;
 try{
  await wait(async()=>!!BrowserWindow.getAllWindows().length,'desktop window');host=BrowserWindow.getAllWindows()[0];
  await wait(()=>host.webContents.executeJavaScript(`!!document.querySelector('.primary-button')&&!document.querySelector('.primary-button').disabled`),'packaged UI');
  await checkCameraUI(host);
  await host.webContents.executeJavaScript(`navigator.clipboard.writeText=async(t)=>{window.testLink=t};document.querySelector('.primary-button').click()`);
  await wait(()=>host.webContents.executeJavaScript(`!!document.querySelector('.qr-frame img')`),'desktop QR');
  await host.webContents.executeJavaScript(`document.querySelector('.text-button').click()`);const link=await host.webContents.executeJavaScript('window.testLink');
  const phoneSession=session.fromPartition('vcam-phone-test');phoneSession.setPermissionRequestHandler((_w,p,cb)=>cb(p==='media'));
  phone=new BrowserWindow({show:false,width:430,height:932,webPreferences:{session:phoneSession,backgroundThrottling:false}});await phone.loadURL(link);
  await wait(()=>phone.webContents.executeJavaScript(`!!document.querySelector('.primary-button')&&!document.querySelector('.primary-button').disabled`),'phone ready');await phone.webContents.executeJavaScript(`document.querySelector('.primary-button').click()`);
  await wait(()=>host.webContents.executeJavaScript(`document.querySelector('.live-pill')?.textContent.includes('LIVE')`),'desktop video');
  await checkCameraUI(host,{live:true});
  const result=await new Promise((resolve,reject)=>{const p=spawn(path.join(__dirname,'../.cache/VCamProbe.exe'),[path.join(__dirname,'../native/bin/VCamCamera64.dll'),'--external'],{windowsHide:true});let output='';p.stdout.on('data',c=>output+=c);p.on('error',reject);p.on('exit',code=>code===0?resolve(output):reject(new Error(output||'Native probe failed')))});
  const state=await host.webContents.executeJavaScript('window.vcam.status()');
  const dimensions=await host.webContents.executeJavaScript(`({width:document.querySelector('video').videoWidth,height:document.querySelector('video').videoHeight})`);
  fs.writeFileSync(path.join(__dirname,'../.cache/qa/windows-live.png'),(await host.webContents.capturePage()).toPNG());
  console.log(JSON.stringify({result:'PASS',native:result,status:state,dimensions}));await host.webContents.executeJavaScript(`document.querySelector('.disconnect').click()`);phone.destroy();host.destroy();app.quit();
 }catch(e){console.error(e.message);if(host)console.error('Desktop:',await host.webContents.executeJavaScript(`document.querySelector('.message')?.textContent`));if(phone)console.error('Phone:',await phone.webContents.executeJavaScript(`document.querySelector('.message')?.textContent`));phone?.destroy();host?.destroy();app.exit(1)}
});
