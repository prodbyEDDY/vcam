const encoder = new TextEncoder();
export const digest = async (s) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(s))), x => x.toString(16).padStart(2, '0')).join('');
const token = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join('');
const validToken = (v) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const makeCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>alphabet[b&31]).join('');
const json = (body, status = 200) => Response.json(body, {status, headers: {'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer'}});

export async function signaling(request, db) {
  if (!db) return json({error:'Сервис подключения временно недоступен.'}, 503);
  try {
    const url = new URL(request.url), action = url.pathname.split('/').pop(), now = Date.now();
    let body = {};
    if (request.method === 'POST') {
      if (Number(request.headers.get('content-length') || 0) > 100000) return json({error:'Слишком большой запрос.'}, 413);
      const raw = await request.text();
      if (raw.length > 100000) return json({error:'Слишком большой запрос.'}, 413);
      try { body = JSON.parse(raw); } catch { return json({error:'Некорректный запрос.'}, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({error:'Некорректный запрос.'}, 400);
    }
    if (action === 'session' && request.method === 'POST') {
      const ip = request.headers.get('cf-connecting-ip') || 'local';
      const key = await digest(ip + ':' + Math.floor(now / 300000));
      const limit = await db.prepare('INSERT INTO limits (key, count, expires) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key, now + 600000).first();
      if (limit.count > 30) return json({error:'Слишком много подключений. Подожди несколько минут.'}, 429);
      const id = crypto.randomUUID(), hostToken = token(), pairToken = token(), code=makeCode();
      await db.batch([
        db.prepare('DELETE FROM signals WHERE room IN (SELECT id FROM rooms WHERE expires < ?)').bind(now),
        db.prepare('DELETE FROM rooms WHERE expires < ?').bind(now),
        db.prepare('DELETE FROM limits WHERE expires < ?').bind(now),
        db.prepare('INSERT INTO rooms (id, host_hash, pair_hash, code_hash, expires) VALUES (?, ?, ?, ?, ?)').bind(id, await digest(hostToken), await digest(pairToken), await digest(code), now + 600000)
      ]);
      return json({id, hostToken, pairToken, code, expires:now + 600000});
    }
    if (action === 'join' && request.method === 'POST') {
      let codeHash=null;
      if(typeof body.code==='string'){
        const code=body.code.toUpperCase().replace(/[\s-]/g,'');
        if(!/^[A-HJ-NP-Z2-9]{8}$/.test(code))return json({error:'Введи 8 символов кода из приложения VCam на компьютере.'},400);
        const ip=request.headers.get('cf-connecting-ip')||'local';
        const key=await digest('join:'+ip+':'+Math.floor(now/300000));
        const limit=await db.prepare('INSERT INTO limits (key, count, expires) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+600000).first();
        if(limit.count>30)return json({error:'Слишком много попыток. Подожди пять минут или отсканируй QR.'},429);
        codeHash=await digest(code);
      }else if (!validToken(body.token) || typeof body.id !== 'string') return json({error:'Некорректная ссылка.'}, 400);
      const phoneToken = token();
      const row = codeHash
        ? await db.prepare('UPDATE rooms SET phone_hash=?, pair_hash=NULL, code_hash=NULL WHERE code_hash=? AND phone_hash IS NULL AND expires>? RETURNING id').bind(await digest(phoneToken),codeHash,now).first()
        : await db.prepare('UPDATE rooms SET phone_hash=?, pair_hash=NULL, code_hash=NULL WHERE id=? AND pair_hash=? AND phone_hash IS NULL AND expires>? RETURNING id').bind(await digest(phoneToken),body.id,await digest(body.token),now).first();
      return row ? json({id:row.id,phoneToken}) : json({error:'Код не найден, уже использован или устарел. Создай новый в VCam на компьютере.'}, 410);
    }
    if (action !== 'signal' || !['GET','POST','DELETE'].includes(request.method)) return json({error:'Не найдено.'}, 404);
    const id = url.searchParams.get('id'), role = url.searchParams.get('role');
    const auth = request.headers.get('Authorization')?.replace(/^Bearer /, '');
    if (!id || !['host','phone'].includes(role) || !validToken(auth)) return json({error:'Нет доступа.'}, 401);
    const room = await db.prepare('SELECT * FROM rooms WHERE id=? AND expires>?').bind(id, now).first();
    if (!room || room[role + '_hash'] !== await digest(auth)) return json({error:'Сессия завершена. Создай новый QR.'}, 401);
    if (request.method === 'DELETE') {
      if (role !== 'host') return json({error:'Нет доступа.'}, 403);
      await db.batch([db.prepare('DELETE FROM signals WHERE room=?').bind(id), db.prepare('DELETE FROM rooms WHERE id=?').bind(id)]);
      return json({ok:true});
    }
    if (request.method === 'POST') {
      const expected = role === 'host' ? 'offer' : 'answer';
      if (body.type !== expected || typeof body.sdp !== 'string' || body.sdp.length > 90000 || !body.sdp.startsWith('v=0')) return json({error:'Некорректные параметры подключения.'}, 400);
      // One offer and answer per session: retries are idempotent and cannot grow storage.
      await db.prepare('INSERT INTO signals (room, sender, payload) VALUES (?, ?, ?) ON CONFLICT(room,sender) DO UPDATE SET payload=excluded.payload').bind(id, role, JSON.stringify({type:body.type,sdp:body.sdp})).run();
      return json({ok:true});
    }
    const messages = await db.prepare('SELECT payload FROM signals WHERE room=? AND sender=?').bind(id, role === 'host' ? 'phone' : 'host').all();
    return json({messages: messages.results.map(x => JSON.parse(x.payload))});
  } catch (error) {
    console.error('Signaling failure', error instanceof Error ? error.message : 'unknown');
    return json({error:'Не удалось подключиться. Попробуй ещё раз.'}, 503);
  }
}
