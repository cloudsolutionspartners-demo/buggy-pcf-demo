notepad auto-debug-pipeline.ps1
```

Lipește și salvează:
```
# ============================================================
# GET SHIT DONE — Auto-Debug Pipeline Orchestrator
# ============================================================
# Scanner -> Planner -> Fixer -> Tester -> (repeat if FAIL)
# ============================================================

$MAX_CYCLES = 5
$CYCLE = 0

Write-Host ""
Write-Host "======================================================" -ForegroundColor Magenta
Write-Host "   GET SHIT DONE — Auto-Debug Pipeline" -ForegroundColor Magenta
Write-Host "   Scanner -> Planner -> Fixer -> Tester" -ForegroundColor Magenta
Write-Host "======================================================" -ForegroundColor Magenta
Write-Host ""

# Check prerequisites
Write-Host "[PREREQ] Checking tools..." -ForegroundColor Cyan
try { claude --version | Out-Null } catch { Write-Host "Claude Code not found" -ForegroundColor Red; exit 1 }
try { gh auth status 2>&1 | Out-Null } catch { Write-Host "GitHub CLI not authenticated" -ForegroundColor Red; exit 1 }
try { npm --version | Out-Null } catch { Write-Host "npm not found" -ForegroundColor Red; exit 1 }
Write-Host "All tools ready" -ForegroundColor Green
Write-Host ""

while ($CYCLE -lt $MAX_CYCLES) {
    $CYCLE++
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Magenta
    Write-Host "  CYCLE $CYCLE / $MAX_CYCLES" -ForegroundColor Magenta
    Write-Host "================================================" -ForegroundColor Magenta

    # ── STEP 1: SCANNER ──
    Write-Host ""
    Write-Host "[SCANNER] Running bug detection..." -ForegroundColor Yellow
    claude -p "You are the scanner agent. Run 'npm test -- --verbose' and 'npx tsc --noEmit'. Analyze ALL failures and generate BUG_REPORT.md with detailed findings for each bug. Include severity (simple/medium/complex), file, root cause, and which test catches it. Do NOT fix anything. ONLY analyze and report." --agent scanner --allowedTools "Bash(npm *)" "Bash(npx *)" "Read" "Write" "Grep" "Glob"

    if (-not (Test-Path "BUG_REPORT.md")) {
        Write-Host "No BUG_REPORT.md generated — Scanner found nothing!" -ForegroundColor Green
        break
    }

    $BUG_COUNT = (Select-String -Path "BUG_REPORT.md" -Pattern "^### BUG-" | Measure-Object).Count
    Write-Host "Scanner found $BUG_COUNT bug(s)" -ForegroundColor Yellow

    if ($BUG_COUNT -eq 0) {
        Write-Host "No bugs found! Pipeline complete." -ForegroundColor Green
        break
    }

    # ── STEP 2: PLANNER ──
    Write-Host ""
    Write-Host "[PLANNER] Creating GitHub Issues..." -ForegroundColor Cyan

    $OPEN_ISSUES = gh issue list --state open --label "auto-detected" --json number --jq "length" 2>$null
    if (-not $OPEN_ISSUES) { $OPEN_ISSUES = "0" }

    if ($OPEN_ISSUES -eq "0" -or $CYCLE -eq 1) {
        claude -p "You are the planner agent. Read BUG_REPORT.md and create a GitHub Issue for each bug using 'gh issue create'. First ensure labels exist using 'gh label create' with --force flag. Use labels: bug:simple, bug:medium, or bug:complex based on severity, plus auto-detected. Create ONE issue per bug. After creating all issues, write ISSUE_PLAN.md with the summary. Do NOT modify any source code." --agent planner --allowedTools "Bash(gh *)" "Read" "Write" "Grep"
        Write-Host "Issues created on GitHub" -ForegroundColor Cyan
    } else {
        Write-Host "$OPEN_ISSUES existing issues still open, skipping issue creation" -ForegroundColor Cyan
    }

    # ── STEP 3: FIXER ──
    Write-Host ""
    Write-Host "[FIXER] Fixing bugs..." -ForegroundColor Red

    $ISSUES = gh issue list --state open --label "auto-detected" --json number --jq ".[].number" 2>$null

    foreach ($ISSUE_NUM in ($ISSUES -split "`n")) {
        if ([string]::IsNullOrWhiteSpace($ISSUE_NUM)) { continue }
        $ISSUE_NUM = $ISSUE_NUM.Trim()
        Write-Host "  Fixing issue #$ISSUE_NUM..." -ForegroundColor Red

        claude -p "You are the fixer agent. Fix ONLY the bug described in GitHub issue #$ISSUE_NUM. First run 'gh issue view $ISSUE_NUM' to read the details. Then read the relevant source file, make the MINIMAL fix, and verify by running the specific test. If the test passes: 1. git add the changed files 2. Commit with message 'fix: description [closes #$ISSUE_NUM]' 3. git push 4. Close the issue: gh issue close $ISSUE_NUM --comment 'Fixed and verified.' 5. Add label: gh issue edit $ISSUE_NUM --add-label auto-fixed. Do NOT change any test files. Make MINIMAL changes only." --agent fixer --allowedTools "Bash(npm *)" "Bash(npx *)" "Bash(git *)" "Bash(gh *)" "Read" "Edit" "Write" "Grep" "Glob"

        Write-Host "  Issue #$ISSUE_NUM processed" -ForegroundColor Green
    }

    # ── STEP 4: TESTER ──
    Write-Host ""
    Write-Host "[TESTER] Running verification..." -ForegroundColor Green

    claude -p "You are the tester agent. Run 'npm test -- --verbose' and 'npx tsc --noEmit'. Check GitHub issues: 'gh issue list --state open' and 'gh issue list --state closed'. Write TEST_REPORT.md with full results. End with verdict: ALL_PASS or NEEDS_MORE_FIXES." --agent tester --allowedTools "Bash(npm *)" "Bash(npx *)" "Bash(git *)" "Bash(gh *)" "Read" "Write" "Grep" "Glob"

    # Check verdict
    if (Test-Path "TEST_REPORT.md") {
        $VERDICT = Select-String -Path "TEST_REPORT.md" -Pattern "ALL_PASS"
        if ($VERDICT) {
            Write-Host ""
            Write-Host "======================================================" -ForegroundColor Green
            Write-Host "  ALL BUGS FIXED! Pipeline complete!" -ForegroundColor Green
            Write-Host "  Cycles needed: $CYCLE" -ForegroundColor Green
            Write-Host "======================================================" -ForegroundColor Green

            Remove-Item -Path "BUG_REPORT.md" -ErrorAction SilentlyContinue

            Write-Host ""
            $CLOSED = gh issue list --state closed --label "auto-fixed" --json number --jq "length" 2>$null
            $OPEN = gh issue list --state open --label "auto-detected" --json number --jq "length" 2>$null
            Write-Host "Closed issues: $CLOSED" -ForegroundColor Cyan
            Write-Host "Open issues: $OPEN" -ForegroundColor Cyan
            exit 0
        }
    }

    Write-Host "Some bugs remain. Starting cycle $($CYCLE + 1)..." -ForegroundColor Yellow
    Remove-Item -Path "BUG_REPORT.md" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Red
Write-Host "  Max cycles ($MAX_CYCLES) reached." -ForegroundColor Red
Write-Host "  Some bugs may remain. Check GitHub Issues." -ForegroundColor Red
Write-Host "======================================================" -ForegroundColor Red
Write-Host ""
gh issue list --state open --label "auto-detected"