# Build VoxLink Test EXE for Windows
# This script creates a standalone .exe file from PowerShell script

param(
    [string]$OutputPath = ".\VoxLink-QuickTest.exe"
)

Write-Host "🔨 Building VoxLink Quick Test EXE..." -ForegroundColor Cyan

# Check if PS2EXE module is installed
$ps2exeInstalled = Get-Module -ListAvailable -Name ps2exe

if (-not $ps2exeInstalled) {
    Write-Host "📦 Installing PS2EXE module..." -ForegroundColor Yellow
    
    # Check if running as admin
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if ($isAdmin) {
        Install-Module -Name ps2exe -Force -Scope CurrentUser
    } else {
        Write-Host "⚠️  Administrator rights required to install PS2EXE" -ForegroundColor Yellow
        Write-Host "Please run PowerShell as Administrator and execute:" -ForegroundColor Yellow
        Write-Host "  Install-Module -Name ps2exe -Force -Scope CurrentUser" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Or use the alternative method below:" -ForegroundColor Yellow
        exit 1
    }
}

# Import PS2EXE module
Import-Module ps2exe

# Build EXE
Write-Host "🔨 Compiling PowerShell script to EXE..." -ForegroundColor Cyan

$scriptPath = Join-Path $PSScriptRoot "quick-test.ps1"
$iconPath = $null  # You can add an icon file here if you have one

try {
    Invoke-ps2exe -inputFile $scriptPath -outputFile $OutputPath -iconFile $iconPath -title "VoxLink Quick Test" -description "VoxLink Quick Test Tool" -version "1.0.0.0" -noConsole:$false
    
    if (Test-Path $OutputPath) {
        Write-Host "✅ EXE created successfully: $OutputPath" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now run: $OutputPath" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to create EXE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error creating EXE: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}