import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,rmdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const {startUpdates,DAY}=createRequire(import.meta.url)('../desktop/updates.cjs');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const epoch=Date.UTC(2026,9,2);
function fixture(check,{checkStatePath,time=epoch}={}){
 const updater=Object.assign(new EventEmitter(),{checkForUpdates:check});
 const timers=[];
 let clock=time;
 const controller=startUpdates({updater,enabled:true,checkStatePath,now:()=>clock,setTimeoutFn:(f,delay)=>{const timer={f,delay,used:false,cleared:false};timers.push(timer);return timer},clearTimeoutFn:timer=>{timer.cleared=true}});
 return {updater,controller,timers,get time(){return clock},run(){const timer=timers.find(t=>!t.used&&!t.cleared);assert.ok(timer,'scheduled check');timer.used=true;clock+=timer.delay;timer.f()}};
}
test('checks once a day, retries offline failures the next day and never restarts the camera',async()=>{
 let calls=0;const f=fixture(async()=>{calls++;if(calls===1)throw Error('offline');return null});
 assert.equal(calls,0);assert.equal(f.timers[0].delay,15000);
 assert.equal(f.updater.allowDowngrade,false);assert.equal(f.updater.allowPrerelease,true);
 assert.equal(f.updater.autoDownload,true);assert.equal(f.updater.autoInstallOnAppQuit,true);assert.equal(f.updater.autoRunAppAfterInstall,false);
 f.run();await flush();assert.equal(calls,1);assert.match(f.controller.status(),/через сутки/);
 assert.equal(f.timers[1].delay,DAY);
 f.run();await flush();assert.equal(calls,2);assert.equal(f.timers[2].delay,DAY);
 f.controller.stop();assert.ok(f.timers[2].cleared);
 f.timers[2].f();await flush();assert.equal(calls,2);
});
test('restarts preserve the last attempt, including failed checks',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'vcam-updates-'));const file=join(dir,'update-check.json');
 try {
  let calls=0;const check=async()=>{calls++;throw Error('offline')};
  const first=fixture(check,{checkStatePath:file});first.run();await flush();first.controller.stop();
  assert.equal(JSON.parse(readFileSync(file,'utf8')).lastCheckAt,first.time);
  const restarted=fixture(check,{checkStatePath:file,time:first.time+3600000});
  assert.equal(calls,1);assert.equal(restarted.timers[0].delay,DAY-3600000);
  restarted.run();await flush();assert.equal(calls,2);restarted.controller.stop();
 } finally {rmSync(file,{force:true});rmdirSync(dir)}
});
test('corrupt and future timestamps do not indefinitely suppress updates',()=>{
 const dir=mkdtempSync(join(tmpdir(),'vcam-updates-'));const file=join(dir,'update-check.json');
 try {
  for(const value of ['invalid',JSON.stringify({lastCheckAt:epoch+DAY}),JSON.stringify({lastCheckAt:-1})]){
   writeFileSync(file,value);const f=fixture(async()=>null,{checkStatePath:file});assert.equal(f.timers[0].delay,15000);f.controller.stop();
  }
 } finally {rmSync(file,{force:true});rmdirSync(dir)}
});
test('active and completed downloads are not interrupted by another check',async()=>{
 let calls=0,finish;const pending=new Promise(resolve=>{finish=resolve});const f=fixture(async()=>{calls++;return {downloadPromise:pending}});
 f.run();await flush();assert.equal(calls,1);assert.equal(f.timers.length,1);
 f.updater.emit('download-progress',{percent:42.4});assert.match(f.controller.status(),/42%/);
 f.updater.emit('update-downloaded',{version:'0.3.0'});finish();await flush();
 assert.equal(f.timers.length,1);assert.match(f.controller.status(),/после закрытия/);f.controller.stop();
});