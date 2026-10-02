'use client';
import {useEffect,useState} from 'react';
import {resolveLocale,translate,type Locale} from './i18n';
export function useLocale(initial?:Locale){
 const [locale,setValue]=useState<Locale>(initial||'ru');
 useEffect(()=>{
  let saved:string|null=null;try{saved=localStorage.getItem('vcam.language')}catch{}
  const value=saved==='ru'||saved==='en'?saved:initial||window.vcam?.locale||resolveLocale(navigator.language);
  setValue(value);document.documentElement.lang=value;
 },[initial]);
 const setLocale=(value:Locale)=>{setValue(value);document.documentElement.lang=value;try{localStorage.setItem('vcam.language',value)}catch{}void window.vcam?.setLocale?.(value).catch(()=>{});};
 return {locale,setLocale,t:(text:string)=>translate(text,locale)};
}
