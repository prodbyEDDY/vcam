; A separate, brand-versioned icon path bypasses cached icons for VCam.exe.
; Update only existing shortcuts: preserve the user's choice to remove one.
!macro VCamRefreshShortcut shortcutPath
  ${If} ${FileExists} "${shortcutPath}"
    CreateShortCut "${shortcutPath}" "$appExe" "" "$INSTDIR\resources\icons\vcam-purple-v1.ico" 0 "" "" "${APP_DESCRIPTION}"
    ${If} ${Errors}
      Abort "VCam: could not update shortcut ${shortcutPath}"
    ${EndIf}
    WinShell::SetLnkAUMI "${shortcutPath}" "${APP_ID}"
    System::Call 'shell32::SHChangeNotify(i 0x2000, i 0x1005, w "${shortcutPath}", p 0)'
  ${EndIf}
!macroend
