import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {normalizeLocale,readPreferredLocale,savePreferredLocale,text}=require('../desktop/localization.cjs');
test('Windows language preference survives restart and handles a damaged preference file',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'vcam-locale-')),file=path.join(dir,'language.json');
 try{assert.equal(readPreferredLocale(file,'ru-RU'),'ru');assert.equal(readPreferredLocale(file,'en-US'),'en');assert.equal(normalizeLocale('de-DE'),'en');savePreferredLocale(file,'en');assert.equal(readPreferredLocale(file,'ru-RU'),'en');savePreferredLocale(file,'ru');assert.equal(readPreferredLocale(file,'en-US'),'ru');fs.writeFileSync(file,'broken');assert.equal(readPreferredLocale(file,'en-GB'),'en');assert.throws(()=>savePreferredLocale(file,'bad'));}finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('native camera errors and updater messages have English translations',()=>{
 for(const s of ['Ошибка передачи кадров в виртуальную камеру.','Не найден модуль виртуальной камеры. Переустанови VCam.','Автообновления: проверка раз в сутки','Установлена последняя версия · проверка раз в сутки','Загрузка версии 0.2.3…','Обновление загружается: 42%','Версия 0.2.3 установится после закрытия VCam','Обновление недоступно. Следующая попытка через сутки.']){assert.doesNotMatch(text(s,'en'),/[А-Яа-яЁё]/);assert.equal(text(s,'ru'),s)}
});
test('camera, scanner, permission and pairing messages are covered by the English catalog',()=>{
 const ts=require('../web/node_modules/typescript');
 const catalog=JSON.parse(fs.readFileSync(new URL('../web/lib/translations.json',import.meta.url),'utf8'));
 for(const file of ['components/camera-app.tsx','components/qr-scanner.tsx','components/product-actions.tsx','lib/session.ts','lib/signaling.mjs']){
  const source=fs.readFileSync(new URL('../web/'+file,import.meta.url),'utf8'),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function visit(node){if(ts.isStringLiteral(node)&&/[А-Яа-яЁё]/.test(node.text))assert.ok(catalog[node.text],file+': missing '+node.text);if(ts.isJsxText(node)&&/[А-Яа-яЁё]/.test(node.text)&&node.text.trim()!=='Русский')assert.fail(file+': untranslated visible text '+node.text);ts.forEachChild(node,visit)}visit(ast);
 }
});
