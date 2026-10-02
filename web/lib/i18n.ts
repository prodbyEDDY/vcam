import messages from './translations.json';
export type Locale='ru'|'en';
export const resolveLocale=(value?:string|null):Locale=>value?.toLowerCase().startsWith('ru')?'ru':'en';
export function translate(text:string,locale:Locale):string{
 if(locale==='ru')return text;
 const exact=(messages as Record<string,string>)[text];if(exact)return exact;
 const camera=text.match(/^Камера (\d+)$/);if(camera)return `Camera ${camera[1]}`;
 return text;
}
