export function parsePairingQr(value, currentOrigin) {
 try {
  const url = new URL(value);
  const allowed = new Set(['https://vcam.prodbyeddy.chatgpt.site', 'https://vcam-eddy.prodbyeddy.chatgpt.site', currentOrigin]);
  if (!allowed.has(url.origin) || !['/', '/connect', '/connect/'].includes(url.pathname)) return null;
  const hash = new URLSearchParams(url.hash.slice(1));
  const id = hash.get('room'), token = hash.get('key');
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id || '') && /^[a-f0-9]{64}$/.test(token || '') ? {id, token} : null;
 } catch { return null; }
}
