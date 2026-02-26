# VoxLink Quick Test Script for Windows
# Быстрая проверка всех основных компонентов

$ErrorActionPreference = "Stop"

$PASSED = 0
$FAILED = 0

function Test-Pass {
    param([string]$Message)
    Write-Host "✅ PASS: $Message" -ForegroundColor Green
    $script:PASSED++
}

function Test-Fail {
    param([string]$Message)
    Write-Host "❌ FAIL: $Message" -ForegroundColor Red
    $script:FAILED++
}

function Test-Info {
    param([string]$Message)
    Write-Host "ℹ️  INFO: $Message" -ForegroundColor Blue
}

Write-Host "🧪 VoxLink Quick Test" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if Docker is running
Test-Info "Checking if Docker is running..."
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Test-Pass "Docker is installed and running"
    } else {
        Test-Fail "Docker is not running. Please start Docker Desktop"
        exit 1
    }
} catch {
    Test-Fail "Docker is not installed or not in PATH"
    exit 1
}

# Test 2: Check if docker-compose is available
Test-Info "Checking docker-compose..."
try {
    $composeVersion = docker-compose --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Test-Pass "docker-compose is available"
    } else {
        Test-Fail "docker-compose is not available"
    }
} catch {
    Test-Fail "docker-compose is not installed"
}

# Test 3: Check if services are running
Test-Info "Checking if services are running..."
try {
    Push-Location "infra"
    $services = docker-compose ps 2>&1
    if ($services -match "Up") {
        Test-Pass "Services are running"
    } else {
        Test-Fail "Services are not running. Run: docker-compose up -d"
        Pop-Location
        exit 1
    }
    Pop-Location
} catch {
    Test-Fail "Cannot check services status"
    Pop-Location
}

# Test 4: Health check
Test-Info "Testing health endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Test-Pass "Health endpoint is accessible"
    } else {
        Test-Fail "Health endpoint returned status code: $($response.StatusCode)"
    }
} catch {
    Test-Fail "Health endpoint is not accessible: $($_.Exception.Message)"
}

# Test 5: Frontend accessibility
Test-Info "Testing frontend..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Test-Pass "Frontend is accessible"
    } else {
        Test-Fail "Frontend returned status code: $($response.StatusCode)"
    }
} catch {
    Test-Fail "Frontend is not accessible: $($_.Exception.Message)"
}

# Test 6: API documentation
Test-Info "Testing API documentation..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/docs" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Test-Pass "API documentation is accessible"
    } else {
        Test-Fail "API documentation returned status code: $($response.StatusCode)"
    }
} catch {
    Test-Fail "API documentation is not accessible: $($_.Exception.Message)"
}

# Test 7: Database connectivity
Test-Info "Testing database connectivity..."
try {
    Push-Location "infra"
    $result = docker-compose exec -T db pg_isready -U voxlink 2>&1
    if ($LASTEXITCODE -eq 0) {
        Test-Pass "Database is accessible"
    } else {
        Test-Fail "Database is not accessible"
    }
    Pop-Location
} catch {
    Test-Fail "Cannot check database: $($_.Exception.Message)"
    Pop-Location
}

# Test 8: Redis connectivity
Test-Info "Testing Redis connectivity..."
try {
    Push-Location "infra"
    $result = docker-compose exec -T redis redis-cli ping 2>&1
    if ($result -match "PONG") {
        Test-Pass "Redis is accessible"
    } else {
        Test-Fail "Redis is not accessible"
    }
    Pop-Location
} catch {
    Test-Fail "Cannot check Redis: $($_.Exception.Message)"
    Pop-Location
}

# Test 9: WebSocket port
Test-Info "Testing WebSocket port..."
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connection = $tcpClient.BeginConnect("localhost", 4000, $null, $null)
    $wait = $connection.AsyncWaitHandle.WaitOne(2000, $false)
    if ($wait) {
        $tcpClient.EndConnect($connection)
        Test-Pass "WebSocket port is open"
        $tcpClient.Close()
    } else {
        Test-Fail "WebSocket port is not accessible (timeout)"
        $tcpClient.Close()
    }
} catch {
    Test-Fail "WebSocket port is not accessible: $($_.Exception.Message)"
}

# Test 10: API endpoints
Test-Info "Testing API endpoints..."
try {
    $body = @{
        role = "member"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/invite" `
        -Method Post `
        -ContentType "application/json" `
        -Body $body `
        -TimeoutSec 5 `
        -UseBasicParsing
    
    if ($response.StatusCode -eq 201 -or $response.StatusCode -eq 200) {
        Test-Pass "Auth API is working"
    } else {
        Test-Fail "Auth API returned status code: $($response.StatusCode)"
    }
} catch {
    Test-Fail "Auth API is not working: $($_.Exception.Message)"
}

# Test 11: Metrics endpoint
Test-Info "Testing metrics endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/metrics" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Test-Pass "Metrics endpoint is accessible"
    } else {
        Test-Fail "Metrics endpoint returned status code: $($response.StatusCode)"
    }
} catch {
    Test-Fail "Metrics endpoint is not accessible: $($_.Exception.Message)"
}

# Test 12: Check logs for errors
Test-Info "Checking for errors in logs..."
try {
    Push-Location "infra"
    $logs = docker-compose logs --tail=100 2>&1
    $errorCount = ($logs | Select-String -Pattern "error" -CaseSensitive:$false).Count
    if ($errorCount -eq 0) {
        Test-Pass "No errors in recent logs"
    } else {
        Test-Info "Found $errorCount error(s) in logs (may be expected)"
    }
    Pop-Location
} catch {
    Test-Info "Cannot check logs: $($_.Exception.Message)"
    Pop-Location
}

# Test 13: Check disk space
Test-Info "Checking disk space..."
try {
    $drive = Get-PSDrive C
    $freeSpaceGB = [math]::Round($drive.Free / 1GB, 2)
    $usedPercent = [math]::Round((($drive.Used / ($drive.Used + $drive.Free)) * 100), 2)
    
    if ($usedPercent -lt 90) {
        $msg = "Sufficient disk space available ({0}% used, {1} GB free)" -f $usedPercent, $freeSpaceGB
        Test-Pass $msg
    } else {
        $msg = "Low disk space ({0}% used, {1} GB free)" -f $usedPercent, $freeSpaceGB
        Test-Fail $msg
    }
} catch {
    Test-Info "Cannot check disk space: $($_.Exception.Message)"
}

# Test 14: Check memory usage
Test-Info "Checking memory usage..."
try {
    $memory = Get-CimInstance Win32_OperatingSystem
    $totalMemoryGB = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
    $freeMemoryGB = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
    $usedPercent = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize * 100), 2)
    
    if ($usedPercent -lt 90) {
        $msg = "Sufficient memory available ({0}% used, {1} GB free of {2} GB)" -f $usedPercent, $freeMemoryGB, $totalMemoryGB
        Test-Pass $msg
    } else {
        $msg = "High memory usage ({0}% used) - monitor closely" -f $usedPercent
        Test-Info $msg
    }
} catch {
    Test-Info "Cannot check memory: $($_.Exception.Message)"
}

# Summary
Write-Host ""
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "Passed: $PASSED" -ForegroundColor Green
Write-Host "Failed: $FAILED" -ForegroundColor Red
Write-Host ""

if ($FAILED -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some tests failed. Check the output above." -ForegroundColor Red
    exit 1
}