import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createRequire} from 'node:module';
const {startUpdates,HOUR}=createRequire(import.meta.url)('../desktop/updates.cjs');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(check){
 const updater=Object.assign(new EventEmitter(),{checkForUpdates:check});
 let initial,hourly;
 const cleared=[];
 const controller=startUpdates({updater,enabled:true,setTimeoutFn:(f,ms)=>{assert.equal(ms,15000);initial=f;return 1},setIntervalFn:(f,ms)=>{assert.equal(ms,HOUR);hourly=f;return 2},clearTimeoutFn:id=>cleared.push(id),clearIntervalFn:id=>cleared.push(id)});
 return {updater,controller,initial:()=>initial(),hourly:()=>hourly(),cleared};
}
test('updates check hourly, retry offline failures and never restart the camera',async()=>{
 let calls=0;const f=fixture(async()=>{calls++;if(calls===1)throw Error('offline');return null});
 assert.equal(calls,0);assert.equal(f.updater.allowDowngrade,false);assert.equal(f.updater.allowPrerelease,true);
 assert.equal(f.updater.autoDownload,true);assert.equal(f.updater.autoInstallOnAppQuit,true);assert.equal(f.updater.autoRunAppAfterInstall,false);
 f.initial();await flush();assert.equal(calls,1);assert.match(f.controller.status(),/через час/);
 f.hourly();await flush();assert.equal(calls,2);
 f.controller.stop();f.hourly();await flush();assert.equal(calls,2);assert.deepEqual(f.cleared,[1,2]);
});
test('active and completed downloads are not interrupted by another check',async()=>{
 let calls=0,finish;const pending=new Promise(resolve=>{finish=resolve});const f=fixture(async()=>{calls++;return {downloadPromise:pending}});
 f.initial();await flush();f.hourly();await flush();assert.equal(calls,1);
 f.updater.emit('download-progress',{percent:42.4});assert.match(f.controller.status(),/42%/);
 f.updater.emit('update-downloaded',{version:'0.3.0'});finish();await flush();
 f.hourly();await flush();assert.equal(calls,1);assert.match(f.controller.status(),/после закрытия/);
 f.controller.stop();
});
