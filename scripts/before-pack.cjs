const fs=require('node:fs');const path=require('node:path');
module.exports=()=>{
 for(const file of ['native/bin/VCamCamera64.dll','native/bin/VCamCamera32.dll','native/bin/VCamBridge.exe','desktop/ui/index.html']){
  const absolute=path.join(__dirname,'..',file);if(!fs.existsSync(absolute)||fs.statSync(absolute).size===0)throw new Error('Missing required release file: '+file);
 }
};
