const fs=require('node:fs');
const messages=require('./translations.json');
const normalizeLocale=value=>String(value||'').toLowerCase().startsWith('ru')?'ru':'en';
function readPreferredLocale(file,systemLocale){try{const value=JSON.parse(fs.readFileSync(file,'utf8')).locale;if(value==='ru'||value==='en')return value}catch{}return normalizeLocale(systemLocale)}
function savePreferredLocale(file,locale){if(locale!=='ru'&&locale!=='en')throw Error('Invalid language');fs.writeFileSync(file,JSON.stringify({locale}),'utf8')}
function text(message,locale='ru'){
 if(locale==='ru')return message;
 if(messages[message])return messages[message];
 const dynamic=[[/^Загрузка версии (.+)…$/,'Downloading version $1…'],[/^Обновление загружается: (\d+)%$/,'Downloading update: $1%'],[/^Версия (.+) установится после закрытия VCam$/,'Version $1 will install after you close VCam']];
 for(const [pattern,replacement] of dynamic)if(pattern.test(message))return message.replace(pattern,replacement);
 return message;
}
module.exports={normalizeLocale,readPreferredLocale,savePreferredLocale,text};
