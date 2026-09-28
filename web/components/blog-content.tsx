import {type ReactNode} from 'react';
export const headingId=(title:string)=>title.toLowerCase().replace(/[^a-zа-яё0-9\s-]/g,'').trim().replace(/\s+/g,'-');
function inline(text:string):ReactNode[]{return text.split(/(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*)/g).map((part,i)=>{
 const link=part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
 if(link&&/^(https:\/\/|\/(?!\/)|#)/.test(link[2]))return <a key={i} href={link[2]}>{link[1]}</a>;
 if(part.startsWith('**')&&part.endsWith('**'))return <strong key={i}>{part.slice(2,-2)}</strong>;
 return part;
});}
export function contents(body:string){return body.split('\n').filter(l=>l.startsWith('## ')).map(l=>({title:l.slice(3),id:headingId(l.slice(3))}));}
export function BlogContent({body}:{body:string}){return <div className="article-prose">{body.trim().split(/\n\s*\n/).map((block,i)=>{
 if(block.startsWith('### '))return <h3 key={i}>{inline(block.slice(4))}</h3>;
 if(block.startsWith('## '))return <h2 key={i} id={headingId(block.slice(3))}>{inline(block.slice(3))}</h2>;
 const lines=block.split('\n');
 if(lines.every(l=>l.startsWith('|'))){const cells=lines.filter((_,n)=>n!==1).map(l=>l.split('|').slice(1,-1).map(c=>c.trim()));return <div className="article-table" tabIndex={0} role="region" aria-label="Таблица сравнения" key={i}><table><thead><tr>{cells[0].map((c,n)=><th key={n} scope="col">{inline(c)}</th>)}</tr></thead><tbody>{cells.slice(1).map((row,n)=><tr key={n}>{row.map((c,k)=><td key={k}>{inline(c)}</td>)}</tr>)}</tbody></table></div>;}
 if(lines.every(l=>l.startsWith('- ')))return <ul key={i}>{lines.map((l,n)=><li key={n}>{inline(l.slice(2))}</li>)}</ul>;
 if(lines.every(l=>/^\d+\. /.test(l)))return <ol key={i}>{lines.map((l,n)=><li key={n}>{inline(l.replace(/^\d+\. /,''))}</li>)}</ol>;
 return <p key={i}>{inline(block)}</p>;
 })}</div>;}
