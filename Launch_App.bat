@echo off
set "BASE_DIR=%~dp0"
set "EXE_PATH=%BASE_DIR%dist-electron\win-unpacked\Healthcare Management System.exe"

echo 🏥 Healthcare Management System Launcher
echo ------------------------------------------
echo Checking for the program...
echo Path: "%EXE_PATH%"

if exist "%EXE_PATH%" (
    echo [OK] Program found!
    echo [OK] Launching now...
    start "" "%EXE_PATH%"
    echo [OK] Your final, fixed, and perfect dashboard is opening! 🧪🏥✨🚀
    timeout /t 5
) else (
    echo [ERROR] The program was not found at this location!
    echo Please make sure the folder "dist-electron" exists.
    pause
)
exit
