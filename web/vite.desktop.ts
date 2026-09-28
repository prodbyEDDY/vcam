import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({root:path.join(root,'desktop'),publicDir:path.join(root,'public'),base:'./',plugins:[react()],resolve:{alias:{'@':root}},css:{postcss:path.join(root,'postcss.config.mjs')},build:{outDir:path.join(root,'../desktop/ui'),emptyOutDir:true}});
