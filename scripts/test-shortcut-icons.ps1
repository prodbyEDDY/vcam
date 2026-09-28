$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$version = (Get-Content "$projectRoot/package.json" -Raw | ConvertFrom-Json).version
$testRoot = Join-Path $projectRoot '.cache/shortcut-icon-test'
New-Item -ItemType Directory -Force -Path "$testRoot/resources/icons" | Out-Null
$cacheRoot = Join-Path $env:LOCALAPPDATA 'electron-builder/Cache'
$compiler = Get-ChildItem $cacheRoot -Recurse -Filter makensis.exe | Where-Object { $_.Directory.Name -eq 'Bin' } | Select-Object -First 1
$plugin = Get-ChildItem $cacheRoot -Recurse -Filter WinShell.dll | Where-Object { $_.Directory.Name -eq 'x86-unicode' } | Select-Object -First 1
if (!$compiler -or !$plugin) { throw 'Build the NSIS installer before running this check.' }
$appExe = Join-Path $projectRoot 'release/win-unpacked/VCam.exe'
$icon = Join-Path $projectRoot 'release/win-unpacked/resources/icons/vcam-purple-v1.ico'
if ((Get-FileHash $icon).Hash -ne (Get-FileHash "$projectRoot/desktop/icon.ico").Hash) { throw 'Packaged shortcut icon does not match the brand icon.' }
Copy-Item -LiteralPath $icon -Destination "$testRoot/resources/icons/vcam-purple-v1.ico" -Force
$shortcutShell = New-Object -ComObject WScript.Shell
foreach ($name in @('desktop','start-menu')) {
  $link = $shortcutShell.CreateShortcut("$testRoot/$name.lnk")
  $link.TargetPath = $appExe
  $link.IconLocation = "$appExe,0"
  $link.Save()
}
$absentShortcut = 'removed-' + [Guid]::NewGuid().ToString() + '.lnk'
$fixture = @'
Unicode true
SilentInstall silent
RequestExecutionLevel user
!include "LogicLib.nsh"
!include "FileFunc.nsh"
!addplugindir /x86-unicode "@PLUGIN@"
!define APP_DESCRIPTION "VCam"
!define APP_ID "dev.prodbyeddy.vcam"
!include "@ROOT@\desktop\shortcut-icon.nsh"
OutFile "@TEST@\shortcut-test.exe"
Var appExe
Section
  StrCpy $INSTDIR "@TEST@"
  StrCpy $appExe "@EXE@"
  ClearErrors
  !insertmacro VCamRefreshShortcut "$INSTDIR\desktop.lnk"
  ClearErrors
  !insertmacro VCamRefreshShortcut "$INSTDIR\start-menu.lnk"
  ClearErrors
  !insertmacro VCamRefreshShortcut "$INSTDIR\@ABSENT@"
SectionEnd
'@
$fixture = $fixture.Replace('@PLUGIN@',$plugin.Directory.FullName).Replace('@ROOT@',$projectRoot).Replace('@TEST@',$testRoot).Replace('@EXE@',$appExe).Replace('@ABSENT@',$absentShortcut)
Set-Content "$testRoot/shortcut-test.nsi" $fixture -Encoding utf8
& $compiler.FullName /V2 "$testRoot/shortcut-test.nsi"
if ($LASTEXITCODE -ne 0) { throw 'NSIS shortcut test failed to compile.' }
foreach ($pass in 1..2) {
  $process = Start-Process -FilePath "$testRoot/shortcut-test.exe" -WindowStyle Hidden -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw 'NSIS shortcut migration failed.' }
  foreach ($name in @('desktop','start-menu')) {
    $link = $shortcutShell.CreateShortcut("$testRoot/$name.lnk")
    if ($link.TargetPath -ne $appExe -or $link.IconLocation -ne "$testRoot\resources\icons\vcam-purple-v1.ico,0") { throw "Incorrect $name shortcut after pass $pass" }
    $shellFolder = (New-Object -ComObject Shell.Application).Namespace($testRoot)
    if ($shellFolder.ParseName("$name.lnk").ExtendedProperty('System.AppUserModel.ID') -ne 'dev.prodbyeddy.vcam') { throw 'Shortcut app identity missing.' }
  }
  if (Test-Path "$testRoot/$absentShortcut") { throw 'User-removed shortcut was recreated.' }
}
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class VCamShellIconTest {
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
 public struct FileInfo {
  public IntPtr icon; public int index; public uint attributes;
  [MarshalAs(UnmanagedType.ByValTStr, SizeConst=260)] public string displayName;
  [MarshalAs(UnmanagedType.ByValTStr, SizeConst=80)] public string typeName;
 }
 [DllImport("shell32.dll", CharSet=CharSet.Unicode)]
 public static extern IntPtr SHGetFileInfo(string path, uint attributes, ref FileInfo info, uint size, uint flags);
 [DllImport("user32.dll")] public static extern bool DestroyIcon(IntPtr icon);
}
'@
foreach ($entry in @{'application'=$appExe; 'installer'="$projectRoot/release/VCam-Setup-$version-x64.exe"; 'shortcut'="$testRoot/desktop.lnk"}.GetEnumerator()) {
  $info = New-Object VCamShellIconTest+FileInfo
  $iconPath = [IO.Path]::GetFullPath($entry.Value)
  $result = [VCamShellIconTest]::SHGetFileInfo($iconPath, 0, [ref]$info, [Runtime.InteropServices.Marshal]::SizeOf($info), 0x100)
  if ($result -eq [IntPtr]::Zero) { throw "Windows could not resolve the icon: $iconPath" }
  $extracted = [System.Drawing.Icon]::FromHandle($info.icon)
  $bitmap = $extracted.ToBitmap()
  $bitmap.Save("$testRoot/$($entry.Key).png")
  $bitmap.Dispose(); $extracted.Dispose()
  [void][VCamShellIconTest]::DestroyIcon($info.icon)
}
Write-Output 'PASS: packaged icon, Desktop/Start shortcut migration, repeated update, AppUserModelID and removed-shortcut preservation.'
