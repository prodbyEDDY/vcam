// Test-only synthetic camera: the first stream contains a real generated QR.
// Subsequent capture uses Chromium's fake device, exercising camera handoff.
const original=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
let first=true;
navigator.mediaDevices.getUserMedia=async constraints=>{
 if(!first)return original(constraints);first=false;
 const img=new Image();img.src=process.argv.find(x=>x.startsWith('--scanner-image=')).slice(16);
 await img.decode();const canvas=document.createElement('canvas');canvas.width=640;canvas.height=640;
 canvas.getContext('2d').drawImage(img,0,0,640,640);
 const stream=canvas.captureStream(15);window.scannerTestTrack=stream.getVideoTracks()[0];
 return stream;
};
