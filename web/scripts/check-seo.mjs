import assert from 'node:assert/strict';
const base=process.argv[2]||'http://localhost:5174',site='https://vcam.prodbyeddy.chatgpt.site';
const attr=(tag,key)=>tag.match(new RegExp('(?:^|\\s)'+key+'="([^"]*)"'))?.[1];
const tags=(html,tag)=>[...html.matchAll(new RegExp('<'+tag+'\\b[^>]*>','g'))].map(m=>m[0]);
const links=new Set(),titles=new Set(),descriptions=new Set(),pages=new Map();
const xml=await (await fetch(base+'/sitemap.xml')).text();
const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);assert.equal(urls.length,22);assert.equal(new Set(urls).size,22);
for(const url of urls){
 const route=new URL(url).pathname,r=await fetch(base+route);assert.equal(r.status,200,route);const html=await r.text();pages.set(url,html);
 assert.ok(html.includes(`<html lang="${route.startsWith('/en')?'en':'ru'}"`),route+' document language');
 assert.equal((html.match(/<h1(?:\s[^>]*)?>/g)||[]).length,1,route+' one h1');
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1];assert.ok(title&&!titles.has(title),route+' unique title');titles.add(title);
 const meta=tags(html,'meta'),desc=attr(meta.find(m=>attr(m,'name')==='description')||'','content');assert.ok(desc&&!descriptions.has(desc),route+' unique description');descriptions.add(desc);
 assert.equal(new URL(attr(tags(html,'link').find(m=>attr(m,'rel')==='canonical')||'','href')).href,url,route+' canonical');
 assert.ok(!meta.some(m=>attr(m,'name')==='robots'&&attr(m,'content')?.includes('noindex')),route+' indexable');
 const schemas=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));assert.ok(schemas.length,route+' valid structured data');
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const tag of tags(html,'a')){const href=attr(tag,'href');if(href?.startsWith('#'))assert.ok(ids.has(href.slice(1)),route+' anchor '+href);if(href?.startsWith('/'))links.add(href.split('#')[0]);}
 console.log('PASS '+route+' — SSR, language, title, description, canonical, JSON-LD');
}
for(const [url,html] of pages){const alternates=tags(html,'link').filter(l=>attr(l,'hreflang'));for(const tag of alternates){const other=new URL(attr(tag,'href')).href;assert.ok(pages.has(other),url+' language target '+other);assert.ok(tags(pages.get(other),'link').some(l=>attr(l,'hreflang')&&new URL(attr(l,'href')).href===url),url+' reciprocal language link');}}
for(const route of links)assert.equal((await fetch(base+route)).status,200,'internal link '+route);
for(const route of ['/connect','/en/connect']){const r=await fetch(base+route);assert.equal(r.status,200);assert.ok(tags(await r.text(),'meta').some(m=>attr(m,'name')==='robots'&&attr(m,'content')?.includes('noindex')))}
for(const route of ['/missing-page','/en/missing-page','/blog/unknown','/en/guides/unknown'])assert.equal((await fetch(base+route)).status,404,route);
assert.ok(pages.get(site+'/').includes('Пока нет. VCam передаёт только видео.'));
assert.ok(pages.get(site+'/en').includes('The current version uses local Wi-Fi and transmits video only.'));
assert.ok(pages.get(site+'/en/download').includes('.exe"'));
const robots=await (await fetch(base+'/robots.txt')).text();assert.ok(robots.includes('Sitemap: '+site+'/sitemap.xml'));assert.ok(!/^Disallow: \/(?:connect|en\/connect)/m.test(robots));
const llms=await fetch(base+'/llms.txt');assert.equal(llms.status,200);assert.ok((await llms.text()).includes('Video only.'));
for(const agent of ['Googlebot','bingbot','OAI-SearchBot/1.4','Claude-SearchBot','PerplexityBot']){const r=await fetch(base+'/en',{headers:{'User-Agent':agent}});assert.equal(r.status,200,agent);assert.ok((await r.text()).includes('VCam turns your iPhone'))}
console.log('PASS 22 indexable pages, reciprocal hreflang, all internal links, 404, connection noindex, SSR FAQs and five crawler user agents');
