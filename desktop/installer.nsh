!include "x64.nsh"
!include "${PROJECT_DIR}\desktop\shortcut-icon.nsh"
LangString VCamRegisterError 1033 "VCam: could not register the 64-bit camera. Run the installer as administrator."
LangString VCamRegisterError 1049 "VCam: не удалось зарегистрировать 64-битную камеру. Запустите установщик от имени администратора."
!macro customInstall
  ${DisableX64FSRedirection}
  nsExec::ExecToStack '"$SYSDIR\regsvr32.exe" /s "$INSTDIR\resources\native\VCamCamera64.dll"'
  Pop $0
  Pop $1
  ${If} $0 != 0
    MessageBox MB_OK|MB_ICONSTOP "$(VCamRegisterError)"
    Abort
  ${EndIf}
  nsExec::ExecToStack '"$WINDIR\SysWOW64\regsvr32.exe" /s "$INSTDIR\resources\native\VCamCamera32.dll"'
  Pop $0
  Pop $1
  ${EnableX64FSRedirection}
  ; Override the builder's executable-based icon after its shortcut migration.
  ; This also handles shortcuts retained by an automatic update.
  ClearErrors
  !insertmacro VCamRefreshShortcut "$newStartMenuLink"
  ClearErrors
  !insertmacro VCamRefreshShortcut "$newDesktopLink"
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
