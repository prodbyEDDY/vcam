// Run against built CSS as well as the dev server: minification caused the switch regression.
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
module.exports=async function checkCameraUI(window,{phone=false,live=false}={}){
  // Hidden test windows may suspend animation frames; assert settled geometry.
  const style=await window.webContents.insertCSS('*,*::before,*::after{transition:none!important;animation:none!important}');
  const evaluate=code=>window.webContents.executeJavaScript(code);
  const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await click('[aria-label="Настройки"]');await delay(400);
  const checkBounds=async()=>{
    const problems=await evaluate(`Array.from(document.querySelectorAll('[role="switch"]')).flatMap(e=>{
      const r=e.getBoundingClientRect(),t=e.querySelector('[data-slot="switch-thumb"]').getBoundingClientRect();
      const checked=e.getAttribute('aria-checked')==='true';
      const edge=checked?r.right-t.right:t.left-r.left;
      return edge<1||edge>3||t.top<r.top||t.bottom>r.bottom?[e.getAttribute('aria-label')+' thumb outside its endpoint: '+JSON.stringify({edge,root:r.toJSON(),thumb:t.toJSON(),translate:getComputedStyle(e.querySelector('span')).translate})]:[];
    })`);
    if(problems.length)throw Error(problems.join('; '));
  };
  await checkBounds();
  const names=await evaluate(`Array.from(document.querySelectorAll('[role="switch"]:not(:disabled)')).map(e=>e.getAttribute('aria-label'))`);
  for(const name of names){
    const selector=`[role="switch"][aria-label="${name}"]`;
    const before=await evaluate(`document.querySelector(${JSON.stringify(selector)}).getAttribute('aria-checked')`);
    // Clicking the caption should toggle exactly once, too.
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).closest('label').querySelector('span').click()`);await delay(220);await checkBounds();
    const after=await evaluate(`document.querySelector(${JSON.stringify(selector)}).getAttribute('aria-checked')`);
    if(before===after)throw Error(name+' did not toggle');
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
    window.webContents.sendInputEvent({type:'keyDown',keyCode:'Space'});
    window.webContents.sendInputEvent({type:'keyUp',keyCode:'Space'});
    await delay(220);await checkBounds();
    if(await evaluate(`document.querySelector(${JSON.stringify(selector)}).getAttribute('aria-checked')`)!==before)throw Error(name+' keyboard toggle failed');
  }
  if(!phone&&!live){
    const selector='[aria-label="Зеркальное отражение"]';
    if(!await evaluate(`document.querySelector('${selector}').disabled`))throw Error('Disconnected mirror should be disabled');
  }
  const settingsOverflow=await evaluate(`document.querySelector('.settings-body').scrollWidth>document.querySelector('.settings-body').clientWidth+1`);
  if(settingsOverflow)throw Error('Settings overflow horizontally');
  await click('[aria-label="Закрыть настройки"]');await delay(300);
  if(await evaluate(`document.documentElement.scrollWidth>innerWidth+1`))throw Error('Page overflow horizontally');
  console.log(JSON.stringify({ui:'PASS',phone,live,switches:names}));
  await window.webContents.removeInsertedCSS(style);
};
