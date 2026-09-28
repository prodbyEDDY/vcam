import ivcam from './articles/ivcam-alternativa.md?raw';
import droidcam from './articles/droidcam-alternativa.md?raw';
import camo from './articles/camo-alternativa.md?raw';
import epoccam from './articles/epoccam-alternativa.md?raw';
import programs from './articles/programmy-telefon-veb-kamera.md?raw';
import iphone from './articles/iphone-veb-kamera-windows.md?raw';
import android from './articles/android-veb-kamera-windows.md?raw';
import obs from './articles/telefon-kamera-obs.md?raw';
import calls from './articles/telefon-kamera-zoom-discord.md?raw';
import wifi from './articles/wifi-kachestvo-zaderzhka.md?raw';

export type Article = {slug:string;title:string;description:string;category:string;body:string;alt:string;related:string[]};
export const published='2026-09-28';
export const articles: Article[] = [
 {slug:'ivcam-alternativa',title:'Бесплатная альтернатива iVcam: что умеет VCam и как перейти',description:'Сравнение iVcam и VCam: реклама, водяной знак, установка на телефон, качество и ограничения. Пошаговый переход на бесплатную камеру для Windows.',category:'Сравнения',body:ivcam,alt:'Телефон и ноутбук на рабочем столе с фиолетовыми цветами',related:['programmy-telefon-veb-kamera','iphone-veb-kamera-windows','wifi-kachestvo-zaderzhka']},
 {slug:'droidcam-alternativa',title:'Альтернатива DroidCam без приложения на телефоне: VCam для Windows',description:'Чем VCam отличается от DroidCam и DroidCam OBS. Как выбрать подключение, проверить камеру и перейти на бесплатную передачу видео из браузера.',category:'Сравнения',body:droidcam,alt:'Android на подставке рядом с компьютером для видеозвонков',related:['android-veb-kamera-windows','telefon-kamera-obs','programmy-telefon-veb-kamera']},
 {slug:'camo-alternativa',title:'Camo или VCam: бесплатная веб-камера из телефона для Windows',description:'Сравниваем VCam с Camo и Camo Pro: бесплатные функции, разрешение, мобильное приложение и рабочие сценарии. Когда стоит выбрать каждую программу.',category:'Сравнения',body:camo,alt:'Рабочее место для видеосъёмки с камерой телефона',related:['ivcam-alternativa','telefon-kamera-zoom-discord','wifi-kachestvo-zaderzhka']},
 {slug:'epoccam-alternativa',title:'Чем заменить EpocCam на Windows после прекращения поддержки',description:'Статус EpocCam по данным Elgato и инструкция по переходу на VCam. Подключение iPhone, выбор новой камеры и проверка звука перед видеозвонком.',category:'Сравнения',body:epoccam,alt:'iPhone на подставке снимает человека за компьютером',related:['iphone-veb-kamera-windows','camo-alternativa','telefon-kamera-obs']},
 {slug:'programmy-telefon-veb-kamera',title:'Телефон как веб-камера: сравнение VCam, iVcam, DroidCam и Camo',description:'Как выбрать программу для камеры телефона: сравнение бесплатных ограничений, способов подключения и платформ. VCam, iVcam, DroidCam, Camo и EpocCam.',category:'Сравнения',body:programs,alt:'iPhone, Android и ноутбук на одном рабочем столе',related:['ivcam-alternativa','droidcam-alternativa','camo-alternativa']},
 {slug:'iphone-veb-kamera-windows',title:'Как использовать iPhone как веб-камеру на Windows без приложения на телефоне',description:'Подробная настройка iPhone и VCam: установка на Windows, QR и ручной код, Safari, выбор объектива, поворот изображения и диагностика подключения.',category:'Подключение',body:iphone,alt:'Камеры iPhone на настольном держателе',related:['telefon-kamera-zoom-discord','wifi-kachestvo-zaderzhka','epoccam-alternativa']},
 {slug:'android-veb-kamera-windows',title:'Android как веб-камера для Windows: подключение через браузер',description:'Как подключить Android к Windows через VCam: разрешения Chrome, QR-код, настройки качества и сеть. Сравнение со встроенной камерой Microsoft.',category:'Подключение',body:android,alt:'Android-смартфон на подставке в домашнем кабинете',related:['droidcam-alternativa','wifi-kachestvo-zaderzhka','telefon-kamera-obs']},
 {slug:'telefon-kamera-obs',title:'Камера телефона в OBS Studio: настройка VCam, видео и звука',description:'Пошаговая настройка телефона как камеры OBS на Windows. Источник DirectShow, разрешение, кадрирование, отдельный микрофон и проверка записи.',category:'Инструкции',body:obs,alt:'Стол автора видео с телефоном и компьютером для записи',related:['wifi-kachestvo-zaderzhka','iphone-veb-kamera-windows','droidcam-alternativa']},
 {slug:'telefon-kamera-zoom-discord',title:'Как подключить камеру телефона к Zoom, Discord и видеозвонкам',description:'Используем VCam для звонков на Windows: выбираем камеру и микрофон, настраиваем кадр, проверяем собеседника и решаем проблемы с чёрным экраном.',category:'Инструкции',body:calls,alt:'Человек участвует в видеозвонке за ноутбуком',related:['iphone-veb-kamera-windows','android-veb-kamera-windows','wifi-kachestvo-zaderzhka']},
 {slug:'wifi-kachestvo-zaderzhka',title:'Камера телефона по Wi-Fi: как уменьшить задержку и настроить качество',description:'Почему тормозит камера телефона и что проверить: Wi-Fi, 1080p и 4K, 30 и 60 FPS, нагрев, микрофон и настройки OBS. Практический план диагностики.',category:'Решение проблем',body:wifi,alt:'Роутер, смартфон и ноутбук в домашней сети',related:['telefon-kamera-obs','telefon-kamera-zoom-discord','programmy-telefon-veb-kamera']},
];
export const getArticle=(slug:string)=>articles.find(a=>a.slug===slug);
export const wordCount=(body:string)=>body.replace(/\[[^\]]+\]\([^)]*\)/g,m=>m.slice(1,m.indexOf(']'))).split(/\s+/).filter(Boolean).length;
export const readingTime=(body:string)=>Math.max(1,Math.ceil(wordCount(body)/180));
