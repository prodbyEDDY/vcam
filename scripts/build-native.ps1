$ErrorActionPreference='Stop'
$taskRoot=Split-Path $PSScriptRoot -Parent
$vswhere=Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
$installation=& $vswhere -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if(!$installation){throw 'Install Visual Studio Build Tools with Desktop development with C++ and the Windows SDK.'}
$msbuild=Join-Path $installation 'MSBuild\Current\Bin\MSBuild.exe'
$toolset=if(Test-Path (Join-Path $installation 'VC\Tools\MSVC\14.4*')){'v143'}elseif($installation -match '2022'){'v143'}else{'v142'}
$out=(Join-Path $taskRoot 'native\bin')+'/'
New-Item -ItemType Directory -Force $out | Out-Null
foreach($platform in @('x64','Win32')){
 $bits=if($platform -eq 'x64'){'64'}else{'32'}
 $intermediate=(Join-Path $taskRoot "native\Build\filter$bits")+'/'
 & $msbuild (Join-Path $taskRoot 'native\UnityCaptureFilter.vcxproj') /nologo /v:minimal /p:Configuration=Release "/p:Platform=$platform" "/p:PlatformToolset=$toolset" /p:WindowsTargetPlatformVersion=10.0 "/p:TargetName=VCamCamera$bits" "/p:OutDir=$out" "/p:IntDir=$intermediate"
 if($LASTEXITCODE){throw "Camera build failed: $platform"}
}
& $msbuild (Join-Path $taskRoot 'native\bridge.vcxproj') /nologo /v:minimal /p:Configuration=Release /p:Platform=x64 "/p:PlatformToolset=$toolset"
if($LASTEXITCODE){throw 'Frame bridge build failed'}
& (Join-Path $out 'VCamBridge.exe') --self-test
if($LASTEXITCODE){throw 'Shared memory self-test failed'}
