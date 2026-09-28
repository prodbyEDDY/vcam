// Browser-facing website flows. Camera receiver and WebRTC are tested in desktop-smoke.cjs.
const {app,BrowserWindow}=require('electron');const fs=require('node:fs');const path=require('node:path');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const wait=async(fn,label)=>{for(let i=0;i<100;i++){if(await fn())return;await delay(100)}throw Error('Timeout: '+label)};
app.whenReady().then(async()=>{let w;try{
 w=new BrowserWindow({show:false,width:1280,height:900,webPreferences:{backgroundThrottling:false}});
 const js=s=>w.webContents.executeJavaScript(s);await w.loadURL(process.env.VCAM_QA_SITE||'http://localhost:5173');
 await wait(()=>js(`!!document.querySelector('.landing')`),'landing');await delay(800);
 if(await js(`!!document.querySelector('.qr-frame')`))throw Error('Website must not create QR');
 if(!await js(`document.title.includes('iVcam')&&JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent).offers.price==='0'`))throw Error('SEO metadata missing');
 await js(`document.querySelector('.share-button').click()`);await wait(()=>js(`!!document.querySelector('.support-dialog')`),'star dialog before share');
 if(!await js(`document.querySelector('.support-dialog').textContent.includes('по желанию')`))throw Error('Star must be optional');
 await js(`navigator.share=async data=>{window.shared=data};Array.from(document.querySelectorAll('.support-dialog button')).find(b=>b.textContent.includes('Поделиться ссылкой')).click()`);
 await wait(()=>js(`window.shared?.url.includes('/releases/tag/v0.2.0')`),'share download link');
 await wait(()=>js(`!document.querySelector('.support-dialog')`),'share dialog closed');
 await js(`document.querySelector('.help-link').click()`);await wait(()=>js(`document.querySelectorAll('.help-step').length===3`),'help cards');
 await js(`document.querySelector('[aria-label="Закрыть инструкцию"]').click()`);await delay(250);
 await js(`document.querySelector('.download-actions .action-primary').click()`);await wait(()=>js(`!!document.querySelector('.support-dialog a[download],.support-dialog a[href$=".exe"]')`),'download link');
 await js(`document.querySelector('[aria-label="Закрыть окно поддержки"]').click()`);await delay(250);
 for(const size of [[430,932],[932,430],[320,740]]){w.setContentSize(...size);await delay(100);if(await js(`document.documentElement.scrollWidth>innerWidth+1`))throw Error('Horizontal overflow: '+size);}
 await w.loadURL(new URL('/connect',process.env.VCAM_QA_SITE||'http://localhost:5173').href);
 await wait(()=>js(`!!document.querySelector('main[data-ready="true"] #connection-code')`),'phone connection');
 if(await js(`!!document.querySelector('.qr-frame')`))throw Error('Phone must not host');
 await js(`document.querySelector('#connection-code').focus()`);await w.webContents.insertText('ABCD EFGH');
 await wait(()=>js(`!document.querySelector('.code-form button').disabled`),'manual input');
 if(!await js(`document.querySelector('meta[name="robots"]').content.includes('noindex')`))throw Error('Connection route must be noindex');
 console.log('Website PASS: landing, SEO, optional star, share link, download, help, responsive sizes, manual connection, no browser hosting');w.destroy();app.exit(0);
}catch(e){console.error(e);w?.destroy();app.exit(1)}});
