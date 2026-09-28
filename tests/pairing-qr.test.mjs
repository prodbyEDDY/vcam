import test from 'node:test';import assert from 'node:assert/strict';import {parsePairingQr} from '../web/lib/pairing-qr.mjs';
test('scanner accepts VCam pairing links and rejects unrelated or malformed QR codes',()=>{
 const origin='https://vcam.prodbyeddy.chatgpt.site',id='12345678-1234-1234-1234-123456789abc',token='a'.repeat(64),fragment=`#room=${id}&key=${token}`;
 assert.deepEqual(parsePairingQr(origin+'/connect'+fragment,origin),{id,token});
 assert.deepEqual(parsePairingQr(origin+'/'+fragment,origin),{id,token});
 for(const input of ['https://example.com/connect'+fragment,'javascript:alert(1)',origin+'/other'+fragment,origin+'/connect#room=x&key=y',origin+'.evil.example/connect'+fragment])assert.equal(parsePairingQr(input,origin),null);
});
