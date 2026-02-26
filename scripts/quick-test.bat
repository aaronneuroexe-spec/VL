@echo off
REM VoxLink Quick Test Script for Windows
REM Batch wrapper for PowerShell script

echo ========================================
echo VoxLink Quick Test
echo ========================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell is not available
    echo Please install PowerShell or use WSL
    pause
    exit /b 1
)

REM Get the script directory
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Change to project root
cd /d "%PROJECT_ROOT%"

REM Run PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "%SCRIPT_DIR%quick-test.ps1"

REM Capture exit code
set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% EQU 0 (
    echo.
    echo Test completed successfully!
) else (
    echo.
    echo Test completed with errors!
)

pause
exit /b %EXIT_CODE%