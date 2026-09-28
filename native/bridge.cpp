#include "shared.inl"
#include <stdio.h>
#include <io.h>
#include <fcntl.h>
#include <vector>
#include <string.h>

// Little-endian VCAM header: magic, width, height, RGBA byte count.
struct FrameHeader { uint32_t magic, width, height, length; };
static bool readExact(void* dst,size_t length){
  size_t done=0;while(done<length){size_t n=fread((char*)dst+done,1,length-done,stdin);if(!n)return false;done+=n;}return true;
}
static void received(int w,int h,int stride,SharedImageMemory::EFormat,SharedImageMemory::EResizeMode,SharedImageMemory::EMirrorMode,int,uint8_t* data,void* result){
  *(bool*)result=(w==4&&h==4&&stride==4&&data[0]==37&&data[63]==37);
}
int main(int argc,char** argv){
  if(argc>1&&!strcmp(argv[1],"--self-test")){
    SharedImageMemory receiver(0),sender(0);bool result=false;
    receiver.Receive(received,&result);sender.SendIsReady();receiver.Receive(received,&result);
    unsigned char pixels[64];memset(pixels,37,sizeof(pixels));
    if(!sender.SendIsReady())return 2;
    sender.Send(4,4,4,sizeof(pixels),SharedImageMemory::FORMAT_UINT8,SharedImageMemory::RESIZEMODE_LINEAR,SharedImageMemory::MIRRORMODE_DISABLED,500,pixels);
    receiver.Receive(received,&result);puts(result?"Shared memory frame transfer passed":"Shared memory frame transfer FAILED");return result?0:3;
  }
  _setmode(_fileno(stdin),_O_BINARY);setvbuf(stdout,NULL,_IONBF,0);
  SharedImageMemory sender(0);std::vector<uint8_t> pixels;FrameHeader h;ULONGLONG last=0;
  while(readExact(&h,sizeof(h))){
    if(h.magic!=0x4d414356 || h.width<4 || h.height<4 || h.width>3840 || h.height>3840 || (uint64_t)h.width*h.height>3840ULL*2160 || h.length!=(uint64_t)h.width*h.height*4){fprintf(stderr,"Invalid frame header\n");return 4;}
    pixels.resize(h.length);if(!readExact(pixels.data(),pixels.size()))return 5;
    bool consumer=sender.SendIsReady();
    if(consumer)consumer=sender.Send(h.width,h.height,h.width,h.length,SharedImageMemory::FORMAT_UINT8,SharedImageMemory::RESIZEMODE_LINEAR,SharedImageMemory::MIRRORMODE_DISABLED,500,pixels.data())==SharedImageMemory::SENDRES_OK;
    ULONGLONG now=GetTickCount64();if(now-last>1000){printf("{\"consumer\":%s}\n",consumer?"true":"false");last=now;}
  }
  return 0;
}
