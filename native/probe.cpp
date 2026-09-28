// Tests the compiled DirectShow DLL without registering it or modifying Windows.
#include "shared.inl"
#include <dshow.h>
#include <stdio.h>
#include <vector>
#pragma comment(lib,"ole32.lib")
#pragma comment(lib,"strmiids.lib")
struct __declspec(uuid("6B652FFF-11FE-4FCE-92AD-0266B5D7C78F")) ISampleGrabber : IUnknown {
 virtual HRESULT STDMETHODCALLTYPE SetOneShot(BOOL)=0;
 virtual HRESULT STDMETHODCALLTYPE SetMediaType(const AM_MEDIA_TYPE*)=0;
 virtual HRESULT STDMETHODCALLTYPE GetConnectedMediaType(AM_MEDIA_TYPE*)=0;
 virtual HRESULT STDMETHODCALLTYPE SetBufferSamples(BOOL)=0;
 virtual HRESULT STDMETHODCALLTYPE GetCurrentBuffer(long*,long*)=0;
 virtual HRESULT STDMETHODCALLTYPE GetCurrentSample(IMediaSample**)=0;
 virtual HRESULT STDMETHODCALLTYPE SetCallback(IUnknown*,long)=0;
};
static const GUID GrabberCLSID={0xC1F400A0,0x3F08,0x11d3,{0x9F,0x0B,0x00,0x60,0x08,0x03,0x9E,0x37}};
static const GUID NullCLSID={0xC1F400A4,0x3F08,0x11d3,{0x9F,0x0B,0x00,0x60,0x08,0x03,0x9E,0x37}};
static const GUID CameraCLSID={0xecdf41c5,0x92ad,0x4999,{0x86,0x66,0x91,0x2b,0xd3,0xe7,0x00,0x10}};
static IPin* pin(IBaseFilter* filter,PIN_DIRECTION direction){IEnumPins* e=nullptr;filter->EnumPins(&e);IPin* p=nullptr;while(e->Next(1,&p,nullptr)==S_OK){PIN_DIRECTION d;p->QueryDirection(&d);if(d==direction){e->Release();return p;}p->Release();}e->Release();return nullptr;}
#define CHECK(x) {HRESULT hr=(x);if(FAILED(hr)){printf("FAIL %s: 0x%08lX\n",#x,hr);return 2;}}
int wmain(int argc,wchar_t** argv){
 if(argc<2)return 1;const bool external=argc>2;CHECK(CoInitializeEx(nullptr,COINIT_MULTITHREADED));
 HMODULE dll=LoadLibraryW(argv[1]);if(!dll){printf("LoadLibrary failed %lu\n",GetLastError());return 1;}
 auto factoryFn=(HRESULT(STDAPICALLTYPE*)(REFCLSID,REFIID,void**))GetProcAddress(dll,"DllGetClassObject");
 IClassFactory* factory=nullptr;CHECK(factoryFn(CameraCLSID,IID_IClassFactory,(void**)&factory));
 IBaseFilter *camera=nullptr,*grabber=nullptr,*sink=nullptr;IGraphBuilder* graph=nullptr;ISampleGrabber* sample=nullptr;IMediaControl* control=nullptr;
 CHECK(factory->CreateInstance(nullptr,IID_IBaseFilter,(void**)&camera));CHECK(CoCreateInstance(CLSID_FilterGraph,nullptr,CLSCTX_INPROC_SERVER,IID_IGraphBuilder,(void**)&graph));
 CHECK(CoCreateInstance(GrabberCLSID,nullptr,CLSCTX_INPROC_SERVER,IID_IBaseFilter,(void**)&grabber));CHECK(grabber->QueryInterface(__uuidof(ISampleGrabber),(void**)&sample));
 AM_MEDIA_TYPE mt={};mt.majortype=MEDIATYPE_Video;mt.subtype=MEDIASUBTYPE_RGB24;CHECK(sample->SetMediaType(&mt));CHECK(sample->SetBufferSamples(TRUE));
 CHECK(CoCreateInstance(NullCLSID,nullptr,CLSCTX_INPROC_SERVER,IID_IBaseFilter,(void**)&sink));
 CHECK(graph->AddFilter(camera,L"VCam"));CHECK(graph->AddFilter(grabber,L"Frame test"));CHECK(graph->AddFilter(sink,L"Sink"));
 IPin* out=pin(camera,PINDIR_OUTPUT);IPin* in=pin(grabber,PINDIR_INPUT);CHECK(graph->Connect(out,in));out->Release();in->Release();
 out=pin(grabber,PINDIR_OUTPUT);in=pin(sink,PINDIR_INPUT);CHECK(graph->Connect(out,in));out->Release();in->Release();
 CHECK(graph->QueryInterface(IID_IMediaControl,(void**)&control));CHECK(control->Run());
 SharedImageMemory sender(0);std::vector<uint8_t> rgba(1920*1080*4);
 for(size_t i=0;i<rgba.size();i+=4){rgba[i]=219;rgba[i+1]=73;rgba[i+2]=31;rgba[i+3]=255;}
 if(external){
   const bool motion=argc>2&&wcscmp(argv[2],L"--motion")==0;bool found=false;unsigned previous=0;int changes=0;
   for(int i=0;i<300&&(!found||motion&&i<100);i++){Sleep(50);long n=0;if(SUCCEEDED(sample->GetCurrentBuffer(&n,nullptr))&&n>0){std::vector<uint8_t> frame(n);if(SUCCEEDED(sample->GetCurrentBuffer(&n,(long*)frame.data()))){unsigned hash=2166136261u;for(size_t j=0;j<frame.size();j+=997){hash=(hash^frame[j])*16777619u;if(frame[j]>40)found=true;}if(previous&&hash!=previous)changes++;previous=hash;}}}
   if(motion){printf("Changing frames while minimized: %d\n",changes);found=found&&changes>=10;}
   printf("External desktop pipeline %s\n",found?"PASS":"FAIL");control->Stop();control->Release();sample->Release();graph->Release();camera->Release();grabber->Release();sink->Release();factory->Release();FreeLibrary(dll);CoUninitialize();return found?0:4;
 }
 for(int i=0;i<50;i++){if(sender.SendIsReady())sender.Send(1920,1080,1920,(DWORD)rgba.size(),SharedImageMemory::FORMAT_UINT8,SharedImageMemory::RESIZEMODE_LINEAR,SharedImageMemory::MIRRORMODE_DISABLED,500,rgba.data());Sleep(20);}
 long bytes=0;CHECK(sample->GetCurrentBuffer(&bytes,nullptr));std::vector<uint8_t> image(bytes);CHECK(sample->GetCurrentBuffer(&bytes,(long*)image.data()));
 bool ok=bytes==1920*1080*3&&image[0]==31&&image[1]==73&&image[2]==219;
 printf("DirectShow frame: bytes=%ld BGR=%u,%u,%u %s\n",bytes,image[0],image[1],image[2],ok?"PASS":"FAIL");
 control->Stop();control->Release();sample->Release();graph->Release();camera->Release();grabber->Release();sink->Release();factory->Release();FreeLibrary(dll);CoUninitialize();return ok?0:3;
}
