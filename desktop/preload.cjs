const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('vcam',{
 site:process.argv.find(a=>a.startsWith('--vcam-site='))?.slice(12)||'https://vcam.prodbyeddy.chatgpt.site',version:process.argv.find(a=>a.startsWith('--vcam-version='))?.slice(15)||'0.2.3',
 locale:process.argv.find(a=>a.startsWith('--vcam-locale='))?.slice(14)==='ru'?'ru':'en',
 setLocale:locale=>ipcRenderer.invoke('vcam:locale',locale),
 api:(path,options)=>ipcRenderer.invoke('vcam:api',path,options),
 frame:(width,height,data)=>ipcRenderer.invoke('vcam:frame',width,height,data),
 status:()=>ipcRenderer.invoke('vcam:status')
});
