const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('vcam',{
 site:process.argv.find(a=>a.startsWith('--vcam-site='))?.slice(12)||'https://vcam.prodbyeddy.chatgpt.site',version:'0.2.1',
 api:(path,options)=>ipcRenderer.invoke('vcam:api',path,options),
 frame:(width,height,data)=>ipcRenderer.invoke('vcam:frame',width,height,data),
 status:()=>ipcRenderer.invoke('vcam:status')
});
