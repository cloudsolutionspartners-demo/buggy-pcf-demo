$env:Path += ";C:\Program Files\GitHub CLI"

$MAX_CYCLES = 5
$CYCLE = 0

Write-Host ""
Write-Host "======================================================" -ForegroundColor Magenta
Write-Host "   GET SHIT DONE - Auto-Debug Pipeline" -ForegroundColor Magenta
Write-Host "   Scanner - Planner - Fixer - Tester" -ForegroundColor Magenta
Write-Host "======================================================" -ForegroundColor Magenta
Write-Host ""

while ($CYCLE -lt $MAX_CYCLES) {
    $CYCLE++
    Write-Host ""
    Write-Host "===== CYCLE $CYCLE / $MAX_CYCLES =====" -ForegroundColor Magenta

    if (Test-Path "BUG_REPORT.md") { Remove-Item "BUG_REPORT.md" }
    if (Test-Path "TEST_REPORT.md") { Remove-Item "TEST_REPORT.md" }

    Write-Host ""
    Write-Host "[SCANNER] Running bug detection..." -ForegroundColor Yellow
    claude -p "You are the scanner agent. Run 'npm test -- --verbose' and analyze ALL test failures. Generate BUG_REPORT.md. IMPORTANT: Each bug MUST be formatted as a heading starting with exactly '### BUG-' followed by a number, like '### BUG-001: Title'. Include severity, file, root cause, and test name for each. Do NOT fix anything." --agent scanner --allowedTools "Bash(npm *)" "Bash(npx *)" "Read" "Write" "Grep" "Glob"

    if (-not (Test-Path "BUG_REPORT.md")) {
        Write-Host "No BUG_REPORT.md - Scanner found nothing!" -ForegroundColor Green
        break
    }

    $CONTENT = Get-Content "BUG_REPORT.md" -Raw
    $BUG_COUNT = ([regex]::Matches($CONTENT, "###\s+BUG-")).Count

    if ($BUG_COUNT -eq 0) {
        $BUG_COUNT = ([regex]::Matches($CONTENT, "(?i)bug")).Count
        if ($BUG_COUNT -gt 2) {
            Write-Host "Scanner found bugs (non-standard format). Proceeding..." -ForegroundColor Yellow
            $BUG_COUNT = 11
        } else {
            Write-Host "No bugs found! Done." -ForegroundColor Green
            break
        }
    } else {
        Write-Host "Scanner found $BUG_COUNT bug(s)" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "[PLANNER] Creating GitHub Issues..." -ForegroundColor Cyan
    claude -p "You are the planner agent. Read BUG_REPORT.md. First create labels: run gh label create bug:simple --color 0E8A16 --force, gh label create bug:medium --color FBCA04 --force, gh label create bug:complex --color D93F0B --force, gh label create auto-detected --color 1D76DB --force, gh label create auto-fixed --color 5319E7 --force, gh label create verified --color 0075CA --force. Then for EACH bug create a GitHub Issue with gh issue create. Use appropriate severity label plus auto-detected. Write ISSUE_PLAN.md when done. Do NOT modify source code." --agent planner --allowedTools "Bash(gh *)" "Read" "Write" "Grep"
    Write-Host "Issues created on GitHub" -ForegroundColor Cyan

    Write-Host ""
    Write-Host "[FIXER] Fixing bugs..." -ForegroundColor Red
    $ISSUES = gh issue list --state open --label "auto-detected" --json number --jq ".[].number" 2>$null

    if ($ISSUES) {
        foreach ($LINE in ($ISSUES -split "`n")) {
            $NUM = $LINE.Trim()
            if ($NUM -eq "") { continue }
            Write-Host "  Fixing issue #$NUM..." -ForegroundColor Red
            claude -p "You are the fixer agent. Fix ONLY the bug in GitHub issue #$NUM. Run gh issue view $NUM to read details. Read the source file, make the MINIMAL fix, verify by running the specific test with npm test. If test passes: git add ., commit with message fix: description closes #$NUM, git push, then gh issue close $NUM --comment Fixed, then gh issue edit $NUM --add-label auto-fixed. Do NOT change test files." --agent fixer --allowedTools "Bash(npm *)" "Bash(npx *)" "Bash(git *)" "Bash(gh *)" "Read" "Edit" "Write" "Grep" "Glob"
            Write-Host "  Issue #$NUM processed" -ForegroundColor Green
        }
    }

    Write-Host ""
    Write-Host "[TESTER] Running verification..." -ForegroundColor Green
    claude -p "You are the tester agent. Run npm test -- --verbose. Check gh issue list --state open and gh issue list --state closed. Write TEST_REPORT.md with full results. End with verdict on its own line: ALL_PASS or NEEDS_MORE_FIXES." --agent tester --allowedTools "Bash(npm *)" "Bash(npx *)" "Bash(git *)" "Bash(gh *)" "Read" "Write" "Grep" "Glob"

    if (Test-Path "TEST_REPORT.md") {
        $VERDICT = Select-String -Path "TEST_REPORT.md" -Pattern "ALL_PASS" -ErrorAction SilentlyContinue
        if ($VERDICT) {
            Write-Host ""
            Write-Host "===== ALL BUGS FIXED! Cycles: $CYCLE =====" -ForegroundColor Green
            $CLOSED = gh issue list --state closed --label "auto-fixed" --json number --jq "length" 2>$null
            $OPEN = gh issue list --state open --label "auto-detected" --json number --jq "length" 2>$null
            Write-Host "Closed: $CLOSED  Open: $OPEN" -ForegroundColor Cyan
            exit 0
        }
    }

    Write-Host "Some bugs remain. Next cycle..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Max cycles reached. Check GitHub Issues." -ForegroundColor Red
gh issue list --state open --label "auto-detected"
