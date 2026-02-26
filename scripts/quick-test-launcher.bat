@echo off
REM VoxLink Quick Test Launcher
REM Simple launcher that works from anywhere

title VoxLink Quick Test

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Change to project root
cd /d "%PROJECT_ROOT%"

REM Check if Docker is running
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Docker is not running!
    echo ========================================
    echo.
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

REM Check if services are running
cd infra
docker-compose ps | findstr "Up" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo WARNING: VoxLink services are not running!
    echo ========================================
    echo.
    echo Starting services...
    docker-compose up -d
    echo.
    echo Waiting for services to start...
    timeout /t 10 /nobreak >nul
)
cd ..

REM Run the test
echo.
echo ========================================
echo Running VoxLink Quick Test...
echo ========================================
echo.

powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%SCRIPT_DIR%quick-test.ps1"

set EXIT_CODE=%ERRORLEVEL%

echo.
echo ========================================
if %EXIT_CODE% EQU 0 (
    echo Test completed successfully!
) else (
    echo Test completed with errors!
)
echo ========================================
echo.

pause
exit /b %EXIT_CODE%