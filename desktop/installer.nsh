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
