import {articles,published} from '@/content/blog';
import {SITE} from '@/lib/product';
import {guidesEn} from '@/content/guides-en';
import {updated} from '@/lib/seo';
export function GET(){const urls=[...['/','/blog','/download','/about','/en','/en/download','/en/about','/en/guides'].map(path=>({path,date:updated})),...articles.map(a=>({path:`/blog/${a.slug}`,date:published})),...guidesEn.map(a=>({path:`/en/guides/${a.slug}`,date:updated}))];return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(a=>`<url><loc>${SITE}${a.path}</loc><lastmod>${a.date}</lastmod></url>`).join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=3600'}});}
