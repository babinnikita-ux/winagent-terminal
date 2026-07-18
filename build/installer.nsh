!include "LogicLib.nsh"
!include "WinMessages.nsh"

!macro _WinAgentBroadcastEnvironment
  System::Call 'USER32::SendMessageTimeout(p 0xffff, i ${WM_SETTINGCHANGE}, p 0, t "Environment", i 0, i 5000, *p .r0)'
!macroend

!macro customInstall
  ReadRegStr $0 HKCU "Environment" "Path"
  ${If} $0 == ""
    WriteRegExpandStr HKCU "Environment" "Path" "$INSTDIR\resources\cli-bin"
  ${Else}
    WriteRegExpandStr HKCU "Environment" "Path" "$0;$INSTDIR\resources\cli-bin"
  ${EndIf}
  !insertmacro _WinAgentBroadcastEnvironment
!macroend
