import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {signaling} from '../web/lib/signaling.mjs';
function fixture(){
 const sql=new DatabaseSync(':memory:');for(const name of readdirSync(new URL('../web/drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../web/drizzle/'+name,import.meta.url),'utf8'));
 const wrap=(query,args=[])=>({bind(...values){return wrap(query,values)},async first(){return sql.prepare(query).get(...args)||null},async all(){return {results:sql.prepare(query).all(...args)}},async run(){return sql.prepare(query).run(...args)}});
 const db={prepare:q=>wrap(q),batch:async statements=>{sql.exec('BEGIN');try{const r=await Promise.all(statements.map(s=>s.run()));sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}};
 const call=async(path,body,auth,method)=>{const r=await signaling(new Request('https://vcam.test/api/'+path,{method:method||(body?'POST':'GET'),headers:{'content-type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},...(body?{body:JSON.stringify(body)}:{})}),db);return {status:r.status,...await r.json()}};
 return {sql,call};
}
test('single-use pairing, role separation, offer/answer and teardown',async()=>{
 const {sql,call}=fixture();const host=await call('session',{});assert.equal(host.status,200);assert.equal(host.hostToken.length,64);
 const row=sql.prepare('SELECT * FROM rooms').get();assert.notEqual(row.host_hash,host.hostToken);assert.notEqual(row.pair_hash,host.pairToken);
 const join=await call('join',{id:host.id,token:host.pairToken});assert.equal(join.status,200);
 assert.equal((await call('join',{id:host.id,token:host.pairToken})).status,410);
 const hp=`signal?id=${host.id}&role=host`,pp=`signal?id=${host.id}&role=phone`;
 assert.equal((await call(hp,null,join.phoneToken)).status,401);
 assert.equal((await call(pp,{type:'offer',sdp:'v=0\r\n'},join.phoneToken)).status,400);
 assert.equal((await call(hp,{type:'offer',sdp:'v=0\r\no=host'},host.hostToken)).status,200);
 assert.equal((await call(pp,null,join.phoneToken)).messages[0].sdp,'v=0\r\no=host');
 await call(hp,{type:'offer',sdp:'v=0\r\no=retry'},host.hostToken);assert.equal(sql.prepare('SELECT count(*) AS n FROM signals').get().n,1);
 await call(pp,{type:'answer',sdp:'v=0\r\no=phone'},join.phoneToken);assert.equal((await call(hp,null,host.hostToken)).messages[0].type,'answer');
 assert.equal((await call(pp,null,join.phoneToken,'DELETE')).status,403);
 assert.equal((await call(hp,null,host.hostToken,'DELETE')).status,200);
 assert.equal((await call(pp,null,join.phoneToken)).status,401);assert.equal(sql.prepare('SELECT count(*) AS n FROM signals').get().n,0);sql.close();
});
test('manual code is hashed, single-use, shared with QR and rate-limited',async()=>{
 const {sql,call}=fixture();const h=await call('session',{});
 assert.match(h.code,/^[A-HJ-NP-Z2-9]{8}$/);assert.notEqual(sql.prepare('SELECT code_hash FROM rooms').get().code_hash,h.code);
 const joined=await call('join',{code:h.code.slice(0,4).toLowerCase()+' '+h.code.slice(4).toLowerCase()});
 assert.equal(joined.status,200);assert.equal(joined.id,h.id);
 assert.equal((await call('join',{code:h.code})).status,410);assert.equal((await call('join',{id:h.id,token:h.pairToken})).status,410);
 const h2=await call('session',{});await call('join',{id:h2.id,token:h2.pairToken});assert.equal((await call('join',{code:h2.code})).status,410);
 const h3=await call('session',{});sql.prepare('UPDATE rooms SET expires=0 WHERE id=?').run(h3.id);assert.equal((await call('join',{code:h3.code})).status,410);
 assert.equal((await call('join',{code:'123'})).status,400);
 for(let i=0;i<26;i++)await call('join',{code:'AAAAAAAA'});
 assert.equal((await call('join',{code:'AAAAAAAA'})).status,429);sql.close();
});
test('expired QR and bounded requests',async()=>{
 const {sql,call}=fixture();const h=await call('session',{});sql.prepare('UPDATE rooms SET expires=0').run();
 assert.equal((await call('join',{id:h.id,token:h.pairToken})).status,410);
 assert.equal((await call('join',{id:h.id,token:'bad'})).status,400);
 assert.equal((await call('join',{x:'x'.repeat(100001)})).status,413);
 for(let i=0;i<29;i++)await call('session',{});
 assert.equal((await call('session',{})).status,429);sql.close();
});
