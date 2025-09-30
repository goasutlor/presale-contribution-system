Param(
    [int]$IntervalSeconds = 5,
    [string]$Branch = "main",
    [switch]$RunOnce
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Get-Item $PSScriptRoot).Parent.FullName
$logPath = Join-Path $repoRoot "auto-sync.log"
$stopFile = Join-Path (Join-Path $repoRoot 'scripts') '.stop-autosync'

function Write-Log {
    Param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp`t$Message" | Out-File -FilePath $logPath -Append -Encoding utf8
}

Write-Log "Auto-sync starting. Repo: $repoRoot, Branch: $Branch, Interval: ${IntervalSeconds}s"

Set-Location $repoRoot

# Ensure git identity exists
$name = git config user.name
if (-not $name) { git config user.name 'auto-sync' | Out-Null }
$email = git config user.email
if (-not $email) { git config user.email 'auto-sync@example.com' | Out-Null }

# Ensure we're on the target branch
$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($currentBranch -ne $Branch) {
    Write-Log "Checkout to branch $Branch (current: $currentBranch)"
    git checkout -B $Branch | Out-Null
}

while ($true) {
    try {
        if (Test-Path $stopFile) {
            Write-Log "Stop file detected. Exiting."
            break
        }

        $status = git status --porcelain
        $statusCount = if ($status) { ($status -split "`n").Count } else { 0 }
        Write-Log "Heartbeat. Pending changes: $statusCount"

        if ($statusCount -gt 0) {
            Write-Log "Changes detected. Preparing to sync."
            git add -A | Out-Null
            if ($LASTEXITCODE -ne 0) { Write-Log "git add failed code $LASTEXITCODE" }

            $commitMsg = "chore(sync): auto sync $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
            git commit -m $commitMsg | Out-Null
            $commitExit = $LASTEXITCODE
            if ($commitExit -eq 0) { Write-Log "Committed: $commitMsg" } else { Write-Log "git commit skipped/failed with code $commitExit" }

            git pull --rebase --autostash origin $Branch | Out-Null
            $pullExit = $LASTEXITCODE
            if ($pullExit -ne 0) {
                Write-Log "git pull --rebase failed ($pullExit). Attempting plain pull."
                git pull origin $Branch --no-edit | Out-Null
                if ($LASTEXITCODE -ne 0) { Write-Log "Plain pull failed. Manual intervention may be required." }
            }

            git push origin HEAD:$Branch | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $local = (git rev-parse HEAD).Trim()
                $remote = (git ls-remote origin "refs/heads/$Branch").Split("`t")[0].Trim()
                Write-Log "Push OK. Local: $local Remote: $remote"
            } else {
                Write-Log "git push failed code $LASTEXITCODE"
            }
        }
    } catch {
        Write-Log "Error: $($_.Exception.Message)"
    }
    if ($RunOnce) { Write-Log "RunOnce complete. Exiting."; break }
    Start-Sleep -Seconds $IntervalSeconds
}


