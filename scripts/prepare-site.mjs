import {cpSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'web'),destination=path.join(root,'.cache','sites-source');
mkdirSync(destination,{recursive:true});
const omit=new Set(['node_modules','.git','.wrangler','.sites-runtime','.next','tsconfig.tsbuildinfo']);
cpSync(source,destination,{recursive:true,filter:p=>!omit.has(path.basename(p))});
console.log(JSON.stringify({checkout:destination}));
