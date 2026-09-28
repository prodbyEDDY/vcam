const {app,BrowserWindow,ipcMain,shell,session}=require('electron');
const {spawn,execFile}=require('node:child_process');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
// Video delivery must continue when the receiver window is minimized/occluded.
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
const SITE=!app.isPackaged&&['http://localhost:5173','http://127.0.0.1:5173','http://127.0.0.1:5174'].includes(process.env.VCAM_TEST_SITE)?process.env.VCAM_TEST_SITE:'https://vcam.prodbyeddy.chatgpt.site';
let win,bridge,consumer=false,bridgeError='',inFlight=false;
const ui=path.join(__dirname,'ui','index.html');
const nativePath=()=>app.isPackaged?path.join(process.resourcesPath,'native'):path.join(__dirname,'..','native','bin');
function startBridge(){
 if(bridge)return;
 bridge=spawn(path.join(nativePath(),'VCamBridge.exe'),[],{stdio:['pipe','pipe','pipe'],windowsHide:true});
 let pending='';bridge.stdout.on('data',chunk=>{pending+=chunk.toString();const lines=pending.split('\n');pending=lines.pop();for(const line of lines){try{consumer=JSON.parse(line).consumer===true}catch{}}});
 bridge.stderr.on('data',()=>{bridgeError='Ошибка передачи кадров в виртуальную камеру.'});
 bridge.on('error',()=>{bridgeError='Не найден модуль виртуальной камеры. Переустанови VCam.';bridge=null});
 bridge.on('exit',()=>{bridge=null;consumer=false});
 bridge.stdin.on('error',()=>{bridgeError='Передача кадров остановлена.'});
}
const trusted=(event)=>event.sender===win?.webContents&&event.senderFrame?.url.startsWith(pathToFileURL(ui).href);
if(!app.requestSingleInstanceLock()){app.quit()}else{
 app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.focus()}});
 app.whenReady().then(()=>{
  session.defaultSession.setPermissionRequestHandler((_wc,_permission,callback)=>callback(false));
  ipcMain.handle('vcam:api',async(event,route,options={})=>{
   if(!trusted(event)||typeof route!=='string'||!/^\/api\/(session|join|signal)(\?|$)/.test(route))throw new Error('Недопустимый запрос.');
   const url=new URL(route,SITE);if(url.origin!==SITE)throw new Error('Недопустимый адрес.');
   const method=options.method||'GET';if(!['GET','POST','DELETE'].includes(method))throw new Error('Недопустимый метод.');
   if(options.body&&options.body.length>100000)throw new Error('Слишком большой запрос.');
   const headers={'Content-Type':'application/json'};if(options.headers?.Authorization)headers.Authorization=String(options.headers.Authorization);
   const r=await fetch(url,{method,headers,body:method==='POST'?options.body:undefined,redirect:'error',signal:AbortSignal.timeout(15000)});
   const body=await r.json().catch(()=>({error:'Сервис подключения недоступен. Проверь интернет.'}));if(!r.ok)throw new Error(body.error||'Ошибка подключения');return body;
  });
  ipcMain.handle('vcam:frame',async(event,width,height,data)=>{
   if(!trusted(event))throw new Error('Нет доступа.');
   if(!Number.isInteger(width)||!Number.isInteger(height)||width<4||height<4||width>3840||height>3840||width*height>3840*2160||!(data instanceof ArrayBuffer)||data.byteLength!==width*height*4)throw new Error('Некорректный кадр.');
   if(inFlight)return false;startBridge();if(!bridge?.stdin.writable)return false;
   const header=Buffer.alloc(16);header.writeUInt32LE(0x4d414356,0);header.writeUInt32LE(width,4);header.writeUInt32LE(height,8);header.writeUInt32LE(data.byteLength,12);
   inFlight=true;try{const target=bridge;target.stdin.write(header);await new Promise((resolve,reject)=>target.stdin.write(Buffer.from(data),e=>e?reject(e):resolve()));return true}finally{inFlight=false}
  });
  ipcMain.handle('vcam:status',async(event)=>{
   if(!trusted(event))throw new Error('Нет доступа.');
   const installed=await new Promise(resolve=>execFile('reg.exe',['query','HKLM\\SOFTWARE\\Classes\\CLSID\\{ECDF41C5-92AD-4999-8666-912BD3E70010}\\InprocServer32'],{windowsHide:true},e=>resolve(!e)));
   return {installed,consumer,error:bridgeError};
  });
  win=new BrowserWindow({show:!process.env.VCAM_SMOKE_TEST,width:1240,height:860,minWidth:800,minHeight:660,backgroundColor:'#111113',title:'VCam',titleBarStyle:'hidden',titleBarOverlay:{color:'#111113',symbolColor:'#dedee5',height:44},icon:path.join(__dirname,'icon.ico'),autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),additionalArguments:[`--vcam-site=${SITE}`],contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});
  win.webContents.setWindowOpenHandler(({url})=>{try{const u=new URL(url);if(u.protocol==='https:'&&(u.hostname==='prodbyeddy.com'||u.hostname==='github.com'&&u.pathname.startsWith('/prodbyEDDY/vcam')))void shell.openExternal(url)}catch{}return {action:'deny'}});
  win.webContents.on('will-navigate',(e,url)=>{if(!url.startsWith(pathToFileURL(ui).href))e.preventDefault()});
  win.loadFile(ui);win.on('closed',()=>{win=null});
 });
 app.on('window-all-closed',()=>app.quit());
 app.on('before-quit',()=>{bridge?.stdin.end();bridge?.kill()});
}
