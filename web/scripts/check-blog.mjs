import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.argv[2]||'http://localhost:5173';
const canonical='https://vcam.prodbyeddy.chatgpt.site';
const slugs=fs.readdirSync(new URL('../content/articles/',import.meta.url)).filter(f=>f.endsWith('.md')).map(f=>f.slice(0,-3));
assert.equal(slugs.length,10);
const attribute=(tag,name)=>tag.match(new RegExp(name+'="([^"]*)"'))?.[1];
const tags=(html,name)=>[...html.matchAll(new RegExp('<'+name+'\\b[^>]*>','g'))].map(m=>m[0]);
const metadata=(html,key)=>tags(html,'meta').find(t=>attribute(t,'name')===key||attribute(t,'property')===key);
const linkSet=new Set(),titles=new Set(),descriptions=new Set();
for(const slug of slugs){
 const response=await fetch(base+'/blog/'+slug);assert.equal(response.status,200,slug);
 const html=await response.text();
 assert.equal((html.match(/<h1(?:\s[^>]*)?>/g)||[]).length,1,slug+' h1');
 const title=html.match(/<title>([^<]+)<\/title>/)?.[1];assert.ok(title&&!titles.has(title));titles.add(title);
 const description=attribute(metadata(html,'description')||'','content');assert.ok(description&&!descriptions.has(description));descriptions.add(description);
 const canonicalTag=tags(html,'link').find(t=>attribute(t,'rel')==='canonical');assert.equal(attribute(canonicalTag||'','href'),canonical+'/blog/'+slug);
 assert.equal(attribute(metadata(html,'og:image')||'','content'),canonical+'/images/blog/'+slug+'.webp');
 assert.equal(attribute(metadata(html,'og:type')||'','content'),'article');
 assert.ok(!attribute(metadata(html,'robots')||'','content')?.includes('noindex'));
 const schemas=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
 const graph=schemas.flatMap(s=>s['@graph']||[s]);const article=graph.find(s=>s['@type']==='BlogPosting');assert.ok(article,slug+' schema');assert.equal(article.mainEntityOfPage,canonical+'/blog/'+slug);assert.ok(article.wordCount>850);assert.ok(graph.find(s=>s['@type']==='BreadcrumbList'));
 const prose=html.match(/<div class="article-prose">([\s\S]*?)<section class="article-download">/)?.[1];assert.ok(prose&&prose.length>7000,slug+' SSR body');
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const tag of tags(html,'a')){const href=attribute(tag,'href');if(href?.startsWith('#'))assert.ok(ids.has(href.slice(1)),slug+' anchor '+href);if(href?.startsWith('/'))linkSet.add(href.split('#')[0]);}
 const image=await fetch(base+'/images/blog/'+slug+'.webp');assert.equal(image.status,200);assert.ok(image.headers.get('content-type')?.includes('image/'));
 console.log('PASS '+slug+' — '+article.wordCount+' words, SSR, metadata, schema, image, anchors');
}
for(const route of linkSet){const r=await fetch(base+route);assert.equal(r.status,200,'Internal link '+route);}
const missing=await fetch(base+'/blog/article-does-not-exist');assert.equal(missing.status,404,'Unknown article must be 404');
const sitemap=await fetch(base+'/sitemap.xml');assert.equal(sitemap.status,200);const xml=await sitemap.text();assert.equal((xml.match(/<loc>/g)||[]).length,12);for(const slug of slugs)assert.ok(xml.includes(canonical+'/blog/'+slug));
const home=await (await fetch(base+'/')).text();assert.ok(home.includes('href="/blog"'));
const robots=await (await fetch(base+'/robots.txt')).text();assert.ok(robots.includes('Sitemap: '+canonical+'/sitemap.xml'));assert.ok(!robots.includes('Disallow: /blog'));
console.log('PASS all internal links, sitemap (12 pages), robots, landing link and 404');
