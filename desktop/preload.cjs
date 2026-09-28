const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('vcam',{
 site:'https://vcam-eddy.prodbyeddy.chatgpt.site',version:'0.1.0',
 api:(path,options)=>ipcRenderer.invoke('vcam:api',path,options),
 frame:(width,height,data)=>ipcRenderer.invoke('vcam:frame',width,height,data),
 status:()=>ipcRenderer.invoke('vcam:status')
});
