# PowerShell script to run git-filter-repo using replacements.txt
# Usage: run from repository mirror directory (bare clone):
#   pwsh.exe -ExecutionPolicy Bypass -File .\cleanup.ps1 -RepoUrl "https://github.com/your-org/your-repo.git"

param(
  [string]$RepoUrl = '',
  [string]$MirrorDir = 'repo-mirror.git'
)

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git not found in PATH"
  exit 1
}

if (-not (Get-Command git-filter-repo -ErrorAction SilentlyContinue)) {
  Write-Host "git-filter-repo not found. Install via: pip install git-filter-repo"
  exit 1
}

if (-not $RepoUrl) {
  Write-Error "RepoUrl not provided"
  exit 1
}

if (Test-Path $MirrorDir) {
  Write-Host "Mirror dir already exists: $MirrorDir"
} else {
  git clone --mirror $RepoUrl $MirrorDir
}

Push-Location $MirrorDir

# Ensure replacements file exists
$repl = Join-Path .. 'tools\clean-git-secrets\replacements.txt'
if (-not (Test-Path $repl)) { Write-Error "replacements.txt not found at $repl"; exit 1 }

Write-Host "Running git filter-repo replace-text..."
git filter-repo --replace-text $repl

Write-Host "Expiring reflog and running GC..."
git reflog expire --expire=now --all
ngit gc --prune=now --aggressive 2>$null | Out-Null

Write-Host "Push rewritten history back to origin (force). Use carefully."
# git push --force --mirror $RepoUrl

Pop-Location

Write-Host "Done. Review the repo-mirror.git and when ready, push with --force --mirror."
