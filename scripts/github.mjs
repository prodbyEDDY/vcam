// Uses the existing Git Credential Manager session. Never prints or stores credentials.
import {spawnSync} from 'node:child_process';
import {readFileSync,statSync,existsSync} from 'node:fs';
import path from 'node:path';
const result=spawnSync('git',['-c','credential.interactive=false','credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',windowsHide:true});
if(result.status!==0)throw new Error('GitHub authorization is unavailable. Sign in with Git Credential Manager.');
const fields=Object.fromEntries(result.stdout.trim().split('\n').map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1)]}));
const headers={Authorization:`Bearer ${fields.password}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'VCam-release'};
async function api(url,options={}){const r=await fetch(url.startsWith('https://')?url:'https://api.github.com'+url,{...options,headers:{...headers,...options.headers}});const body=await r.json();if(!r.ok)throw new Error(`GitHub ${r.status}: ${body.message}`);return body}
const mode=process.argv[2];
if(mode==='check'){const user=await api('/user');const repo=await api('/repos/prodbyEDDY/vcam');console.log(JSON.stringify({login:user.login,push:repo.permissions?.push}));}
else if(mode==='describe'){
 const repo=await api('/repos/prodbyEDDY/vcam',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({description:'Free iVcam alternative for Windows. Use an iPhone or Android browser as a webcam via QR or code. No phone app, ads or watermarks.',homepage:'https://vcam.prodbyeddy.chatgpt.site'})});
 await api('/repos/prodbyEDDY/vcam/topics',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({names:['webcam','virtual-camera','ivcam-alternative','iphone-webcam','android-webcam','windows','webrtc','electron','directshow','free-software']})});
 console.log(JSON.stringify({url:repo.html_url,homepage:repo.homepage}));
}
else if(mode==='release'){
 const tag=process.argv[3],file=path.resolve(process.argv[4]),bodyFile=path.resolve(process.argv[5]);
 const existing=await api('/repos/prodbyEDDY/vcam/releases');let release=existing.find(r=>r.tag_name===tag);
 if(!release)release=await api('/repos/prodbyEDDY/vcam/releases',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tag_name:tag,target_commitish:'main',name:`VCam ${tag} — Windows beta`,body:readFileSync(bodyFile,'utf8'),draft:true,prerelease:true})});
 const artifacts=[file,file+'.blockmap',path.join(path.dirname(file),'latest.yml')];
 for(const artifact of artifacts){
  if(!existsSync(artifact))throw new Error('Missing release artifact: '+artifact);
  if(!release.assets.some(a=>a.name===path.basename(artifact))){await api(release.upload_url.split('{')[0]+'?name='+encodeURIComponent(path.basename(artifact)),{method:'POST',headers:{'Content-Type':'application/octet-stream','Content-Length':String(statSync(artifact).size)},body:readFileSync(artifact)});}
 }
 release=await api('/repos/prodbyEDDY/vcam/releases/'+release.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:false,body:readFileSync(bodyFile,'utf8')})});
 console.log(JSON.stringify({url:release.html_url,asset:path.basename(file)}));
}else throw new Error('Use check or release <tag> <asset> <release-notes>');
