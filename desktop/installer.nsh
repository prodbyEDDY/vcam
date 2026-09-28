!include "x64.nsh"
!macro customInstall
  ${DisableX64FSRedirection}
  nsExec::ExecToStack '"$SYSDIR\regsvr32.exe" /s "$INSTDIR\resources\native\VCamCamera64.dll"'
  Pop $0
  Pop $1
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "VCam: could not register the 64-bit camera. Run the installer as administrator."
    Abort
  ${EndIf}
  nsExec::ExecToStack '"$WINDIR\SysWOW64\regsvr32.exe" /s "$INSTDIR\resources\native\VCamCamera32.dll"'
  Pop $0
  Pop $1
  ${EnableX64FSRedirection}
  ; Refresh shortcut icons without rebuilding the user icon cache.
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend
!macro customUnInstall
  ${DisableX64FSRedirection}
  nsExec::ExecToStack '"$SYSDIR\regsvr32.exe" /s /u "$INSTDIR\resources\native\VCamCamera64.dll"'
  Pop $0
  Pop $1
  nsExec::ExecToStack '"$WINDIR\SysWOW64\regsvr32.exe" /s /u "$INSTDIR\resources\native\VCamCamera32.dll"'
  Pop $0
  Pop $1
  ${EnableX64FSRedirection}
!macroend
