// Isolated, hidden Electron integration test. No real camera or production pairing is used.
const {app,BrowserWindow}=require('electron');
app.disableHardwareAcceleration();
const fs=require('node:fs'),path=require('node:path');
const profile=path.join(__dirname,'../.cache/test-profiles/localization-smoke');fs.mkdirSync(profile,{recursive:true});fs.mkdirSync(path.join(__dirname,'../.cache/qa'),{recursive:true});
app.setPath('userData',profile);fs.writeFileSync(path.join(profile,'language.json'),JSON.stringify({locale:'en'}));
process.env.VCAM_SMOKE_TEST='1';
require('../desktop/main.cjs');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(fn,label){for(let i=0;i<100;i++){if(await fn())return;await delay(100)}throw Error('Timeout: '+label)}
app.whenReady().then(async()=>{let window;try{
 await wait(()=>BrowserWindow.getAllWindows().length,'window');window=BrowserWindow.getAllWindows()[0];const evaluate=code=>window.webContents.executeJavaScript(code);
 await wait(()=>evaluate(`document.querySelector('.primary-button')?.textContent.includes('Show QR code')`),'English camera UI');
 if(!await evaluate(`window.vcam.version==='0.2.4'&&window.vcam.locale==='en'&&document.documentElement.lang==='en'`))throw Error('Incorrect native language or version');
 await evaluate(`document.querySelector('[aria-label="Settings"]').click()`);
 await wait(()=>evaluate(`!!document.querySelector('#vcam-language')`),'language setting');
 if(!await evaluate(`document.querySelector('.settings-body').textContent.includes('Auto rotate')`))throw Error('English settings missing');
 await delay(300);fs.writeFileSync(path.join(__dirname,'../.cache/qa/windows-english.png'),(await window.webContents.capturePage()).toPNG());
 await evaluate(`(()=>{const s=document.querySelector('#vcam-language');s.value='ru';s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 await wait(()=>evaluate(`document.querySelector('.settings-heading')?.textContent.includes('Настройки')`),'Russian switch');
 await wait(()=>JSON.parse(fs.readFileSync(path.join(profile,'language.json'),'utf8')).locale==='ru','native persisted preference');
 await evaluate(`document.querySelector('[aria-label="Закрыть настройки"]').click()`);await delay(250);
 await window.reload();await wait(()=>evaluate(`document.querySelector('.primary-button')?.textContent.includes('Показать QR-код')`),'Russian preference after reload');
 await evaluate(`document.querySelector('[aria-label="Настройки"]').click()`);await wait(()=>evaluate(`!!document.querySelector('#vcam-language')`),'reopen settings');
 await evaluate(`(()=>{const s=document.querySelector('#vcam-language');s.value='en';s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
 await wait(()=>evaluate(`document.querySelector('.settings-heading')?.textContent.includes('Settings')`),'English switch');
 await evaluate(`document.querySelector('[aria-label="Close settings"]').click()`);await delay(250);
 await evaluate(`document.querySelector('[aria-label="How to connect your phone"]').click()`);await wait(()=>evaluate(`document.querySelector('.help-dialog')?.textContent.includes('Select the VCam camera')`),'English instructions');
 console.log('PASS English native UI, settings, Russian/English switching, persisted preference, reload, help and version');window.destroy();app.exit(0);
 }catch(e){console.error(e);window?.destroy();app.exit(1)}});
